// app/api/payment/subscription/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ── 1. Load current subscription ────────────────────────────────────────
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { id: true, status: true, plan: true, cancelAtPeriodEnd: true },
    });

    if (!sub || sub.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    if (sub.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "Subscription is already scheduled for cancellation" },
        { status: 400 }
      );
    }

    // ── 2. Soft-cancel: keep access until period end ─────────────────────────
    //    Sets cancelAtPeriodEnd = true so the user keeps premium until their
    //    billing cycle expires, then a webhook / cron flips status → CANCELLED
    //    and role → FREE.  If you want immediate downgrade, use the hard-cancel
    //    block below instead.
    await prisma.$transaction([
      // Mark subscription for cancellation at period end
      prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      }),

      // Write an audit log entry
      prisma.auditLog.create({
        data: {
          userId,
          action: "cancel_subscription",
          details: `Plan: ${sub.plan} — scheduled for cancellation at period end`,
        },
      }),
    ]);

    // ── HARD CANCEL (uncomment to downgrade immediately instead) ─────────────
    // await prisma.$transaction([
    //   prisma.subscription.update({
    //     where: { userId },
    //     data: { status: "CANCELLED", cancelAtPeriodEnd: true },
    //   }),
    //   prisma.user.update({
    //     where: { id: userId },
    //     data: { role: "FREE" },
    //   }),
    //   prisma.auditLog.create({
    //     data: { userId, action: "cancel_subscription", details: `Immediate downgrade from ${sub.plan}` },
    //   }),
    // ]);

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. You will retain access until the end of your billing period.",
    });
  } catch (error) {
    console.error("DELETE /api/payment/subscription/cancel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}