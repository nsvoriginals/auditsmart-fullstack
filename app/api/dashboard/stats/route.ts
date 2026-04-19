// app/api/dashboard/stats/route.ts
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

    // Get dashboard statistics
    const [
      totalAudits,
      completedAudits,
      pendingAudits,
      averageScore,
      recentAudits,
      subscription,
      currentMonthAudits
    ] = await Promise.all([
      prisma.audit.count({ where: { userId } }),
      prisma.audit.count({ where: { userId, status: "COMPLETED" } }),
      prisma.audit.count({ where: { userId, status: "PENDING" } }),
      prisma.audit.aggregate({
        where: { userId, status: "COMPLETED", score: { not: null } },
        _avg: { score: true }
      }),
      prisma.audit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, contractName: true, status: true, score: true, createdAt: true }
      }),
      prisma.subscription.findUnique({
        where: { userId },
        select: { plan: true, status: true, currentPeriodEnd: true }
      }),
      prisma.audit.count({
        where: {
          userId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      })
    ]);

    const remainingAudits = subscription?.plan === "FREE"
      ? Math.max(0, 10 - totalAudits)
      : null;

    return NextResponse.json(
      {
        stats: {
          totalAudits,
          completedAudits,
          pendingAudits,
          averageScore: averageScore._avg.score || 0,
          remainingAudits,
          currentMonthAudits,
        },
        recentAudits,
        subscription: subscription || { plan: "FREE", status: "ACTIVE" },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
