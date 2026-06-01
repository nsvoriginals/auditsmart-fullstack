// lib/teams.ts — SERVER-ONLY. Team-referral attribution + commission tracking.
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

/** Cookie name + TTL used by /r/[code] for team referral attribution. */
export const TEAM_REFERRAL_COOKIE = "team_referral_code";
export const TEAM_REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Attribute a newly created user to a team via team code.
 * No-op if: code missing, code unknown, team inactive, or user already attributed.
 */
export async function attributeTeamReferral(
  newUserId: string,
  code: string | null | undefined
) {
  if (!code) return;

  const team = await prisma.team.findUnique({
    where:  { code },
    select: { id: true, isActive: true },
  });
  if (!team || !team.isActive) return;

  // Don't overwrite an existing attribution.
  const user = await prisma.user.findUnique({
    where:  { id: newUserId },
    select: { referredByTeamId: true },
  });
  if (!user || user.referredByTeamId) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: newUserId },
      data:  { referredByTeamId: team.id },
    }),
    prisma.team.update({
      where: { id: team.id },
      data:  { signupCount: { increment: 1 } },
    }),
  ]);
}

/**
 * Record a team commission when a referred user makes a paid upgrade.
 * Uniqueness on paymentId guarantees idempotence across verify + webhook races.
 * Returns null when the user wasn't team-referred or the payment was already recorded.
 */
export async function recordTeamCommission(args: {
  userId:             string;
  paymentId:          string;
  plan:               UserRole;
  paymentAmountPaise: number;
}) {
  const user = await prisma.user.findUnique({
    where:  { id: args.userId },
    select: {
      referredByTeamId: true,
      referredByTeam:   { select: { id: true, isActive: true, commissionRate: true } },
    },
  });
  if (!user?.referredByTeamId || !user.referredByTeam?.isActive) return null;

  const commission = Math.floor(args.paymentAmountPaise * user.referredByTeam.commissionRate);
  if (commission <= 0) return null;

  try {
    return await prisma.teamCommission.create({
      data: {
        teamId:             user.referredByTeam.id,
        userId:             args.userId,
        paymentId:          args.paymentId,
        plan:               args.plan,
        paymentAmountPaise: args.paymentAmountPaise,
        commissionPaise:    commission,
      },
    });
  } catch (err: any) {
    // P2002 on paymentId unique = already recorded (idempotent no-op).
    if (err?.code === "P2002") return null;
    throw err;
  }
}

export interface TeamReportRow {
  teamId:           string;
  name:             string;
  code:             string;
  commissionRate:   number;
  contactEmail:     string | null;
  payoutDetails:    string | null;
  clickCount:       number;
  signupCount:      number;
  qualifyingCount:  number;        // commissions in period
  totalCommissionPaise: number;    // sum of commissions in period
}

/**
 * Monthly payout report grouped by team. Only counts TeamCommission rows in
 * the [periodStart, periodEnd) window — i.e. first-paid-upgrades during that
 * period.
 */
export async function getTeamPayoutReport(
  periodStart: Date,
  periodEnd:   Date
): Promise<TeamReportRow[]> {
  const [teams, byTeam] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.teamCommission.groupBy({
      by:     ["teamId"],
      where:  { createdAt: { gte: periodStart, lt: periodEnd } },
      _count: { _all: true },
      _sum:   { commissionPaise: true },
    }),
  ]);

  const byTeamMap = new Map(
    byTeam.map(b => [b.teamId, {
      qualifyingCount:      b._count._all,
      totalCommissionPaise: b._sum.commissionPaise ?? 0,
    }])
  );

  return teams.map(t => ({
    teamId:               t.id,
    name:                 t.name,
    code:                 t.code,
    commissionRate:       t.commissionRate,
    contactEmail:         t.contactEmail,
    payoutDetails:        t.payoutDetails,
    clickCount:           t.clickCount,
    signupCount:          t.signupCount,
    qualifyingCount:      byTeamMap.get(t.id)?.qualifyingCount      ?? 0,
    totalCommissionPaise: byTeamMap.get(t.id)?.totalCommissionPaise ?? 0,
  }));
}
