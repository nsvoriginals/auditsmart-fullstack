// app/admin/teams/[id]/page.tsx — edit team + view commission history
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import TeamEditClient from "./_components/TeamEditClient";

export const dynamic = "force-dynamic";

export default async function TeamEditPage({ params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) notFound();

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

  const h     = headers();
  const host  = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const baseUrl = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : "");

  return (
    <TeamEditClient
      team={{
        id:             team.id,
        name:           team.name,
        code:           team.code,
        commissionRate: team.commissionRate,
        contactEmail:   team.contactEmail,
        payoutDetails:  team.payoutDetails,
        isActive:       team.isActive,
        clickCount:     team.clickCount,
        signupCount:    team.signupCount,
        createdAt:      team.createdAt.toISOString(),
      }}
      stats={{
        qualifyingCount:      byTeam._count._all,
        totalCommissionPaise: byTeam._sum.commissionPaise    ?? 0,
        totalRevenuePaise:    byTeam._sum.paymentAmountPaise ?? 0,
      }}
      recent={recent.map(c => ({
        id:                 c.id,
        paymentId:          c.paymentId,
        plan:               c.plan,
        paymentAmountPaise: c.paymentAmountPaise,
        commissionPaise:    c.commissionPaise,
        createdAt:          c.createdAt.toISOString(),
        userEmail:          c.user.email,
        userName:           c.user.name,
      }))}
      baseUrl={baseUrl}
    />
  );
}
