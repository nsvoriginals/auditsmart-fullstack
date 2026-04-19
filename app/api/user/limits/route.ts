// app/api/user/limits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // If no subscription exists, create one for FREE tier
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId: userId,
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Get the plan from subscription (matches UserRole enum: FREE, PREMIUM, ENTERPRISE, ADMIN)
    const plan = subscription.plan;
    
    // Calculate monthly audits (used for PREMIUM/ENTERPRISE)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const auditsThisMonth = await prisma.audit.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });

    // FREE plan tracks lifetime total — all other plans track monthly
    const totalAudits = plan === "FREE"
      ? await prisma.audit.count({ where: { userId } })
      : auditsThisMonth;

    // Limits must match scan/route.ts enforcement values
    let limit: number | null = null;
    let remaining: number | null = null;

    switch (plan) {
      case "FREE":
        limit = 10; // 10 lifetime audits
        remaining = Math.max(0, limit - totalAudits);
        break;
      case "PREMIUM":
        limit = 15; // 15 per month
        remaining = Math.max(0, limit - auditsThisMonth);
        break;
      case "ENTERPRISE":
        limit = 20; // 20 per month
        remaining = Math.max(0, limit - auditsThisMonth);
        break;
      case "ADMIN":
        limit = null;
        remaining = null;
        break;
      default:
        limit = 10;
        remaining = Math.max(0, limit - totalAudits);
    }

    return NextResponse.json(
      {
        plan,
        auditsThisMonth: plan === "FREE" ? totalAudits : auditsThisMonth,
        limit,
        remaining,
        canAudit: remaining === null || remaining > 0,
        isUnlimited: limit === null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching limits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}