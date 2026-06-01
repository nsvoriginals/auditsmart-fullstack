// app/api/admin/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const team = await prisma.team.findUnique({
    where: { id: params.id },
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Aggregate stats + recent commissions for the edit page.
  const [byTeam, recent] = await Promise.all([
    prisma.teamCommission.aggregate({
      where:  { teamId: team.id },
      _count: { _all: true },
      _sum:   { commissionPaise: true, paymentAmountPaise: true },
    }),
    prisma.teamCommission.findMany({
      where:   { teamId: team.id },
      orderBy: { createdAt: "desc" },
      take:    50,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return NextResponse.json({
    team,
    stats: {
      qualifyingCount:      byTeam._count._all,
      totalCommissionPaise: byTeam._sum.commissionPaise    ?? 0,
      totalRevenuePaise:    byTeam._sum.paymentAmountPaise ?? 0,
    },
    recent: recent.map(c => ({
      id:                 c.id,
      paymentId:          c.paymentId,
      plan:               c.plan,
      paymentAmountPaise: c.paymentAmountPaise,
      commissionPaise:    c.commissionPaise,
      createdAt:          c.createdAt.toISOString(),
      userEmail:          c.user.email,
      userName:           c.user.name,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Code is locked — changing it would invalidate live referral links.
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length > 100) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    data.name = name;
  }
  if (body.commissionRate !== undefined) {
    const rate = Number(body.commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return NextResponse.json({ error: "commissionRate must be 0-1" }, { status: 400 });
    }
    data.commissionRate = rate;
  }
  if (body.contactEmail !== undefined) {
    data.contactEmail = body.contactEmail ? String(body.contactEmail).trim() : null;
  }
  if (body.payoutDetails !== undefined) {
    data.payoutDetails = body.payoutDetails ? String(body.payoutDetails).trim() : null;
  }
  if (body.isActive !== undefined) data.isActive = !!body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const team = await prisma.team.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ team });
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("admin team update error:", err);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
