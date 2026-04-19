// app/dashboard/billing/page.tsx — Server Component wrapper
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BillingClient, { type BillingStatus } from "./_components/BillingClient";

const PLAN_AUDIT_LIMITS: Record<string, number> = {
  FREE:       10,
  PREMIUM:    15,
  ENTERPRISE: 20,
  ADMIN:      Infinity,
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  const [user, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        currentMonthAudits: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, plan: true, amount: true, status: true, createdAt: true },
    }),
  ]);

  if (!user) redirect("/auth/signin");

  const sub = user.subscription;
  const planName = (sub?.plan ?? user.role).toString();
  const isPremium = planName !== "FREE" && sub?.status === "ACTIVE" && !sub?.cancelAtPeriodEnd;

  let daysRemaining: number | null = null;
  if (sub?.currentPeriodEnd) {
    const msLeft = sub.currentPeriodEnd.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  const monthLimit = PLAN_AUDIT_LIMITS[planName] ?? 10;
  const auditsRemaining = monthLimit === Infinity
    ? 9999
    : Math.max(0, monthLimit - user.currentMonthAudits);

  const initialData: BillingStatus = {
    plan:                planName.toLowerCase(),
    is_premium:          isPremium,
    status:              sub ? sub.status.toLowerCase() : "none",
    expires_at:          sub?.currentPeriodEnd?.toISOString() ?? null,
    days_remaining:      daysRemaining,
    audits_remaining:    auditsRemaining,
    cancel_at_period_end: sub?.cancelAtPeriodEnd ?? false,
    payment_history:     payments.map((p) => ({
      id:         p.id,
      plan:       p.plan.toLowerCase(),
      amount_inr: Math.round(p.amount / 100),         // paise → ₹
      status:     p.status,
      date:       p.createdAt.toISOString(),
    })),
  };

  return <BillingClient initialData={initialData} />;
}
