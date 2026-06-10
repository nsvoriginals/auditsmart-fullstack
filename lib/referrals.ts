// lib/referrals.ts — SERVER-ONLY. Individual (user-to-user) referral program.
//
// Flow:
//   1. Every user can mint one shareable code (ReferralCode), surfaced at
//      /ref/<code>. Visiting it drops a 30-day cookie and redirects to register.
//   2. On signup we attribute the new user to the referrer (Referral = PENDING)
//      and stamp User.referredById (immutable).
//   3. On the referred user's FIRST paid upgrade the Referral flips to QUALIFIED
//      and the referrer earns a commission. They choose how to take it:
//        - CREDIT → added to their own referralCreditPaise (applied at checkout)
//        - CASH   → left as an owed balance, surfaced for manual payout
//
// Mirrors the team-referral design in lib/teams.ts but keyed on individual users.
import { nanoid } from "nanoid";
import { prisma } from "./prisma";

/** Cookie name + TTL used by /ref/[code] for individual referral attribution. */
export const REFERRAL_COOKIE = "referral_code";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Referrer earns this fraction of the referred user's first paid month. */
export const REFERRAL_COMMISSION_RATE = 0.2; // 20%

/** Public base URL used to build shareable links (server + client safe). */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://auditsmart.org"
  ).replace(/\/+$/, "");
}

export function referralLink(code: string): string {
  return `${appBaseUrl()}/ref/${code}`;
}

/**
 * Return the user's referral code, minting one on first call. Retries on the
 * (astronomically unlikely) unique-code collision.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.referralCode.findUnique({
    where:  { userId },
    select: { code: true },
  });
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(8);
    try {
      const created = await prisma.referralCode.create({
        data:   { userId, code },
        select: { code: true },
      });
      return created.code;
    } catch (err: any) {
      // P2002 on userId = another request minted it first → fetch & return.
      if (err?.code === "P2002") {
        const row = await prisma.referralCode.findUnique({
          where:  { userId },
          select: { code: true },
        });
        if (row) return row.code;
        // else it was a code collision — loop and retry with a fresh code.
      } else {
        throw err;
      }
    }
  }
  throw new Error("Could not generate a unique referral code");
}

/**
 * Attribute a newly created user to a referrer via referral code.
 * No-op if: code missing/unknown, self-referral, or user already attributed.
 * Best-effort — callers should never block signup on this.
 */
export async function attributeReferral(
  newUserId: string,
  code: string | null | undefined
): Promise<void> {
  if (!code) return;

  const refCode = await prisma.referralCode.findUnique({
    where:  { code },
    select: { userId: true },
  });
  if (!refCode) return;

  // Block self-referral.
  if (refCode.userId === newUserId) return;

  // Don't overwrite an existing attribution.
  const user = await prisma.user.findUnique({
    where:  { id: newUserId },
    select: { referredById: true },
  });
  if (!user || user.referredById) return;

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: newUserId },
        data:  { referredById: refCode.userId },
      }),
      prisma.referral.create({
        data: {
          referrerId:     refCode.userId,
          referredUserId: newUserId,
          status:         "PENDING",
        },
      }),
      prisma.referralCode.update({
        where: { userId: refCode.userId },
        data:  { signupCount: { increment: 1 } },
      }),
    ]);
  } catch (err: any) {
    // P2002 on referredUserId = already attributed (idempotent no-op).
    if (err?.code === "P2002") return;
    throw err;
  }
}

/**
 * Reward the referrer when a referred user makes their FIRST paid upgrade.
 * Idempotent: only fires once per Referral (guarded on PENDING status), and
 * stamps firstPaymentId for the audit trail.
 *
 * Returns the updated Referral, or null when there's nothing to reward.
 */
export async function recordReferralReward(args: {
  userId:             string; // the referred user who just paid
  paymentId:          string;
  paymentAmountPaise: number;
}) {
  const referral = await prisma.referral.findUnique({
    where:  { referredUserId: args.userId },
    select: { id: true, status: true, referrerId: true },
  });
  if (!referral || referral.status !== "PENDING") return null;

  const commission = Math.floor(args.paymentAmountPaise * REFERRAL_COMMISSION_RATE);
  if (commission <= 0) return null;

  // Look up how the referrer wants to be paid.
  const referrer = await prisma.user.findUnique({
    where:  { id: referral.referrerId },
    select: { referralPayoutMethod: true },
  });
  if (!referrer) return null;

  try {
    // Race guard: flip PENDING → QUALIFIED and stamp the commission in one
    // conditional write. A concurrent verify/webhook will see count === 0 and
    // bail, so the referrer is credited exactly once.
    const guarded = await prisma.referral.updateMany({
      where: { id: referral.id, status: "PENDING" },
      data: {
        status:          "QUALIFIED",
        firstPaymentId:  args.paymentId,
        commissionPaise: commission,
        qualifiedAt:     new Date(),
      },
    });
    if (guarded.count === 0) return null; // lost the race; the winner credits.

    // CREDIT payout → bump the referrer's redeemable balance immediately.
    // CASH payout → nothing to do here; the QUALIFIED Referral row IS the
    // owed-balance record surfaced for manual payout.
    if (referrer.referralPayoutMethod === "CREDIT") {
      await prisma.user.update({
        where: { id: referral.referrerId },
        data:  { referralCreditPaise: { increment: commission } },
      });
    }

    return prisma.referral.findUnique({ where: { id: referral.id } });
  } catch (err) {
    console.error("recordReferralReward failed:", err);
    return null;
  }
}

export interface ReferralStats {
  code:               string;
  link:               string;
  clickCount:         number;
  signupCount:        number;
  pendingCount:       number;
  qualifiedCount:     number;
  totalEarnedPaise:   number; // sum of commissions across QUALIFIED referrals
  creditBalancePaise: number; // redeemable credit (CREDIT payout method)
  payoutMethod:       "CREDIT" | "CASH";
  payoutDetails:      string | null;
  commissionRate:     number;
  referrals: Array<{
    id:              string;
    status:          "PENDING" | "QUALIFIED" | "REJECTED";
    commissionPaise: number;
    createdAt:       string;
    qualifiedAt:     string | null;
    referredName:    string | null;
    referredEmail:   string; // masked for privacy
  }>;
}

/** Mask an email for display: john.doe@x.com → jo***@x.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

/** Everything the referral dashboard needs in one call. Mints code if absent. */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(userId);

  const [codeRow, user, referrals] = await Promise.all([
    prisma.referralCode.findUnique({
      where:  { userId },
      select: { clickCount: true, signupCount: true },
    }),
    prisma.user.findUnique({
      where:  { id: userId },
      select: { referralCreditPaise: true, referralPayoutMethod: true, referralPayoutDetails: true },
    }),
    prisma.referral.findMany({
      where:   { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take:    100,
      select: {
        id: true, status: true, commissionPaise: true, createdAt: true, qualifiedAt: true,
        referredUser: { select: { name: true, email: true } },
      },
    }),
  ]);

  const qualified = referrals.filter(r => r.status === "QUALIFIED");
  const totalEarnedPaise = qualified.reduce((sum, r) => sum + r.commissionPaise, 0);

  return {
    code,
    link:               referralLink(code),
    clickCount:         codeRow?.clickCount  ?? 0,
    signupCount:        codeRow?.signupCount ?? 0,
    pendingCount:       referrals.filter(r => r.status === "PENDING").length,
    qualifiedCount:     qualified.length,
    totalEarnedPaise,
    creditBalancePaise: user?.referralCreditPaise ?? 0,
    payoutMethod:       (user?.referralPayoutMethod ?? "CREDIT") as "CREDIT" | "CASH",
    payoutDetails:      user?.referralPayoutDetails ?? null,
    commissionRate:     REFERRAL_COMMISSION_RATE,
    referrals: referrals.map(r => ({
      id:              r.id,
      status:          r.status,
      commissionPaise: r.commissionPaise,
      createdAt:       r.createdAt.toISOString(),
      qualifiedAt:     r.qualifiedAt?.toISOString() ?? null,
      referredName:    r.referredUser?.name ?? null,
      referredEmail:   r.referredUser ? maskEmail(r.referredUser.email) : "***",
    })),
  };
}

/** Update the user's payout preference. CASH requires payout details. */
export async function updatePayoutPreference(
  userId: string,
  method: "CREDIT" | "CASH",
  details: string | null
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      referralPayoutMethod:  method,
      referralPayoutDetails: details?.trim() || null,
    },
  });
}
