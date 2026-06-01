// app/api/admin/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

const CODE_REGEX = /^[A-Z0-9_-]{3,32}$/;

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const [teams, byTeam] = await Promise.all([
    prisma.team.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.teamCommission.groupBy({
      by:     ["teamId"],
      _count: { _all: true },
      _sum:   { commissionPaise: true },
    }),
  ]);

  const sums = new Map(byTeam.map(b => [b.teamId, {
    qualifyingCount:      b._count._all,
    totalCommissionPaise: b._sum.commissionPaise ?? 0,
  }]));

  return NextResponse.json({
    teams: teams.map(t => ({
      ...t,
      qualifyingCount:      sums.get(t.id)?.qualifyingCount      ?? 0,
      totalCommissionPaise: sums.get(t.id)?.totalCommissionPaise ?? 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const name           = typeof body.name === "string" ? body.name.trim() : "";
  const codeRaw        = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const commissionRate = Number(body.commissionRate ?? 0.20);
  const contactEmail   = body.contactEmail  ? String(body.contactEmail).trim()  : null;
  const payoutDetails  = body.payoutDetails ? String(body.payoutDetails).trim() : null;
  const isActive       = body.isActive !== false; // default true

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Name is required (1-100 chars)" }, { status: 400 });
  }
  if (!CODE_REGEX.test(codeRaw)) {
    return NextResponse.json({ error: "Code must be 3-32 chars, [A-Z0-9_-] only" }, { status: 400 });
  }
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    return NextResponse.json({ error: "commissionRate must be 0-1" }, { status: 400 });
  }

  try {
    const team = await prisma.team.create({
      data: { name, code: codeRaw, commissionRate, contactEmail, payoutDetails, isActive },
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Code already in use" }, { status: 409 });
    }
    console.error("admin team create error:", err);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
