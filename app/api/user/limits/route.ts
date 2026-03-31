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
    
    // Calculate audits this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const auditsThisMonth = await prisma.audit.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Determine limits based on plan (using your UserRole enum)
    let limit: number | null = null;
    let remaining: number | null = null;
    
    switch (plan) {
      case "FREE":
        limit = 3;
        remaining = Math.max(0, limit - auditsThisMonth);
        break;
      case "PREMIUM":
        limit = 20;  // Premium users get 20 audits per month
        remaining = Math.max(0, limit - auditsThisMonth);
        break;
      case "ENTERPRISE":
        limit = null;  // Unlimited audits
        remaining = null;
        break;
      case "ADMIN":
        limit = null;  // Unlimited audits for admins
        remaining = null;
        break;
      default:
        // Fallback to FREE plan
        limit = 3;
        remaining = Math.max(0, limit - auditsThisMonth);
    }

    return NextResponse.json({
      plan,
      auditsThisMonth,
      limit,
      remaining,
      canAudit: remaining === null || remaining > 0,
      isUnlimited: limit === null,
    });
  } catch (error) {
    console.error("Error fetching limits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}