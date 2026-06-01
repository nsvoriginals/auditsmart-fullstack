// app/admin/teams/page.tsx — server component, fetches team list with stats.
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import TeamsListClient from "./_components/TeamsListClient";

export const dynamic = "force-dynamic";

export default async function TeamsAdminPage() {
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

  const h     = headers();
  const host  = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const baseUrl = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : "");

  const rows = teams.map(t => ({
    id:                   t.id,
    name:                 t.name,
    code:                 t.code,
    commissionRate:       t.commissionRate,
    contactEmail:         t.contactEmail,
    payoutDetails:        t.payoutDetails,
    isActive:             t.isActive,
    clickCount:           t.clickCount,
    signupCount:          t.signupCount,
    createdAt:            t.createdAt.toISOString(),
    qualifyingCount:      sums.get(t.id)?.qualifyingCount      ?? 0,
    totalCommissionPaise: sums.get(t.id)?.totalCommissionPaise ?? 0,
  }));

  return <TeamsListClient initialTeams={rows} baseUrl={baseUrl} />;
}
