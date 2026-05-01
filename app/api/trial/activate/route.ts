import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapPublicPlanToUserPlan, isPublicPlan } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { plan } = body as { plan?: string };

  if (!plan || !isPublicPlan(plan) || plan === "free" || plan === "deep_audit") {
    return NextResponse.json({ error: "Invalid plan — choose pro or enterprise" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasUsedTrial: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.hasUsedTrial) {
    return NextResponse.json({ error: "You have already used your free trial" }, { status: 409 });
  }

  const userRole = mapPublicPlanToUserPlan(plan);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 3);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { role: userRole, hasUsedTrial: true },
    }),
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: userRole,
        status: "ACTIVE",
        isTrial: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: session.user.id,
        plan: userRole,
        status: "ACTIVE",
        isTrial: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
    }),
  ]);

  return NextResponse.json({ success: true, trialEndsAt: trialEndsAt.toISOString() });
}
