// app/admin/payouts/page.tsx — monthly payout report (server-rendered initial,
// client-driven month picker)
import { getTeamPayoutReport } from "@/lib/teams";
import PayoutsClient from "./_components/PayoutsClient";

export const dynamic = "force-dynamic";

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month)!;
  const year = Number(m[1]), mon = Number(m[2]) - 1;
  return {
    from: new Date(Date.UTC(year, mon,     1)),
    to:   new Date(Date.UTC(year, mon + 1, 1)),
  };
}

export default async function PayoutsPage() {
  const month = currentMonthKey();
  const { from, to } = monthRange(month);
  const rows = await getTeamPayoutReport(from, to);

  return <PayoutsClient initialMonth={month} initialRows={rows} />;
}
