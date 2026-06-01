// app/api/admin/payouts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getTeamPayoutReport } from "@/lib/teams";

export const dynamic = "force-dynamic";

function resolvePeriod(searchParams: URLSearchParams) {
  const month = searchParams.get("month");
  if (month) {
    const m = /^(\d{4})-(\d{2})$/.exec(month);
    if (!m) throw new Error("month must be YYYY-MM");
    const year = Number(m[1]), mon = Number(m[2]) - 1;
    return { from: new Date(Date.UTC(year, mon, 1)), to: new Date(Date.UTC(year, mon + 1, 1)) };
  }
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  if (from && to) return { from: new Date(from), to: new Date(to) };

  // Default: current month
  const now = new Date();
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),     1)),
    to:   new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  let period;
  try {
    period = resolvePeriod(req.nextUrl.searchParams);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const rows = await getTeamPayoutReport(period.from, period.to);

  return NextResponse.json({
    periodStart: period.from.toISOString(),
    periodEnd:   period.to.toISOString(),
    rows,
    totals: {
      qualifyingCount:      rows.reduce((s, r) => s + r.qualifyingCount,      0),
      totalCommissionPaise: rows.reduce((s, r) => s + r.totalCommissionPaise, 0),
    },
  });
}
