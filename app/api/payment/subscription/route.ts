// app/api/payment/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Audits allowed per month per plan
const PLAN_AUDIT_LIMITS: Record<string, number> = {
  FREE:       3,
  PREMIUM:    50,
  ENTERPRISE: Infinity,
  ADMIN:      Infinity,
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ── 1. User + subscription in one query ─────────────────────────────────
    const user = await prisma.user.findUnique({
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sub = user.subscription;

    // Prefer subscription.plan when it exists, fall back to user.role
    const planName = (sub?.plan ?? user.role).toString(); // "FREE" | "PREMIUM" | "ENTERPRISE"

    const isPremium =
      planName !== "FREE" &&
      sub?.status === "ACTIVE" &&
      !(sub?.cancelAtPeriodEnd);

    // Days left in current billing period
    let daysRemaining: number | null = null;
    if (sub?.currentPeriodEnd) {
      const msLeft = sub.currentPeriodEnd.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    }

    // Audits remaining this month
    const monthLimit = PLAN_AUDIT_LIMITS[planName] ?? 3;
    const auditsRemaining =
      monthLimit === Infinity
        ? 9999                                         // "unlimited" sentinel
        : Math.max(0, monthLimit - user.currentMonthAudits);

    // Status: lowercase for the frontend; "none" when no subscription row yet
    const status = sub ? sub.status.toLowerCase() : "none";
    // → "active" | "cancelled" | "expired" | "none"

    // ── 2. Payment history ───────────────────────────────────────────────────
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        plan: true,
        amount: true,    // paise
        status: true,    // "created" | "paid" | "failed"
        createdAt: true,
      },
    });

    const paymentHistory = payments.map((p) => ({
      id:         p.id,
      plan:       p.plan.toLowerCase(),             // "free" | "premium" | "enterprise"
      amount_inr: Math.round(p.amount / 100),       // paise → ₹
      status:     p.status,
      date:       p.createdAt.toISOString(),
    }));

    // ── 3. Response ──────────────────────────────────────────────────────────
    return NextResponse.json({
      plan:             planName.toLowerCase(),
      is_premium:       isPremium,
      status,
      expires_at:       sub?.currentPeriodEnd?.toISOString() ?? null,
      days_remaining:   daysRemaining,
      audits_remaining: auditsRemaining,
      payment_history:  paymentHistory,
    });
  } catch (error) {
    console.error("GET /api/payment/subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}