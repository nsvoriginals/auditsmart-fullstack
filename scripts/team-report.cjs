#!/usr/bin/env node
// Per-team monthly payout report.
//
// Usage:
//   node scripts/team-report.cjs                  # current month
//   node scripts/team-report.cjs --month 2026-05  # specific month (YYYY-MM)
//   node scripts/team-report.cjs --from 2026-05-01 --to 2026-06-01
//
// Period is half-open: [from, to). When --month is given, expands to
// [first-of-month, first-of-next-month).

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[++i];
  }
  return out;
}

function resolvePeriod(args) {
  if (args.month) {
    const m = /^(\d{4})-(\d{2})$/.exec(args.month);
    if (!m) throw new Error("--month must be YYYY-MM");
    const year = Number(m[1]), mon = Number(m[2]) - 1;
    return { from: new Date(Date.UTC(year, mon, 1)), to: new Date(Date.UTC(year, mon + 1, 1)) };
  }
  if (args.from || args.to) {
    return {
      from: new Date(args.from),
      to:   new Date(args.to),
    };
  }
  const now = new Date();
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(),     1)),
    to:   new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

const fmtINR = paise => "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad    = (s, n) => String(s).padEnd(n);

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const { from, to } = resolvePeriod(args);

  const [teams, byTeam] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.teamCommission.groupBy({
      by: ["teamId"],
      where: { createdAt: { gte: from, lt: to } },
      _count: { _all: true },
      _sum:   { commissionPaise: true, paymentAmountPaise: true },
    }),
  ]);

  const map = new Map(byTeam.map(b => [b.teamId, b]));

  console.log("");
  console.log("Team payout report  " + from.toISOString().slice(0, 10) + "  →  " + to.toISOString().slice(0, 10));
  console.log("─".repeat(96));
  console.log(pad("Team", 22) + pad("Code", 14) + pad("Rate", 8) + pad("Clicks", 9) + pad("Signups", 10) + pad("Quals", 8) + pad("Revenue", 14) + "Payout");
  console.log("─".repeat(96));

  let totalCommission = 0;
  let totalQuals = 0;

  for (const t of teams) {
    const b = map.get(t.id);
    const quals    = b?._count._all ?? 0;
    const revenue  = b?._sum.paymentAmountPaise ?? 0;
    const commission = b?._sum.commissionPaise ?? 0;
    totalCommission += commission;
    totalQuals      += quals;

    console.log(
      pad(t.name.slice(0, 21),                 22) +
      pad(t.code,                              14) +
      pad((t.commissionRate * 100).toFixed(0) + "%", 8) +
      pad(t.clickCount,                         9) +
      pad(t.signupCount,                       10) +
      pad(quals,                                8) +
      pad(fmtINR(revenue),                     14) +
      fmtINR(commission) + (t.isActive ? "" : "  (inactive)")
    );
  }

  console.log("─".repeat(96));
  console.log(pad("TOTAL", 61) + pad(totalQuals, 8) + pad("", 14) + fmtINR(totalCommission));
  console.log("");

  await prisma.$disconnect();
})().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
