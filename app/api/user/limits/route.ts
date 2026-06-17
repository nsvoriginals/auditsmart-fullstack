// app/api/user/limits/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch subscription and monthly count in parallel
    const [rawSubscription, auditsThisMonth] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.audit.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    ]);

    // Auto-create FREE subscription if missing
    const subscription =
      rawSubscription ??
      (await prisma.subscription.create({
        data: {
          userId,
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }));

    const plan = subscription.plan;

    // FREE plan tracks lifetime total; paid plans track monthly
    const totalAudits =
      plan === "FREE"
        ? await prisma.audit.count({ where: { userId } })
        : auditsThisMonth;

    let limit: number | null = null;
    let remaining: number | null = null;

    switch (plan) {
      case "FREE":
        limit = 3;
        remaining = Math.max(0, limit - totalAudits);
        break;
      case "PREMIUM":
        limit = 15;
        remaining = Math.max(0, limit - auditsThisMonth);
        break;
      case "ENTERPRISE":
        limit = 20;
        remaining = Math.max(0, limit - auditsThisMonth);
        break;
      case "ADMIN":
        limit = null;
        remaining = null;
        break;
      default:
        limit = 3;
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
        // Short TTL: stale for up to 30s but always revalidate so the UI
        // reflects a just-completed audit within one poll cycle.
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
      }
    );
  } catch (error) {
    console.error("Error fetching limits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}