#!/usr/bin/env node
// Create a marketing team and its referral code.
//
// Usage:
//   node scripts/seed-team.cjs \
//     --name "Team Alpha" \
//     --code TEAMALPHA \
//     --rate 0.20 \
//     --email alpha@partner.com \
//     --payout "UPI: alpha@upi"
//
// Flags:
//   --name    (required) human-readable team name
//   --code    (required) unique code used in /r/<code> links (uppercase, alphanumeric)
//   --rate    (optional) commission rate as a decimal. Default 0.20 (= 20%).
//   --email   (optional) contact email for the team
//   --payout  (optional) free-form payout details (UPI, bank ref, etc.)
//   --inactive (optional) create as inactive

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key === "inactive") { out.inactive = true; continue; }
    out[key] = argv[++i];
  }
  return out;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.name || !args.code) {
    console.error("usage: node scripts/seed-team.cjs --name <name> --code <CODE> [--rate 0.20] [--email <email>] [--payout <details>] [--inactive]");
    process.exit(1);
  }

  const code = String(args.code).trim();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    console.error("error: --code must be 3-32 chars, [A-Z0-9_-] only (got: " + code + ")");
    process.exit(1);
  }

  const rate = args.rate !== undefined ? Number(args.rate) : 0.20;
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    console.error("error: --rate must be a number in [0, 1] (got: " + args.rate + ")");
    process.exit(1);
  }

  try {
    const team = await prisma.team.create({
      data: {
        name:           args.name,
        code,
        commissionRate: rate,
        contactEmail:   args.email ?? null,
        payoutDetails:  args.payout ?? null,
        isActive:       !args.inactive,
      },
    });
    console.log("✅ Team created");
    console.log("   id:    " + team.id);
    console.log("   name:  " + team.name);
    console.log("   code:  " + team.code);
    console.log("   rate:  " + (team.commissionRate * 100).toFixed(0) + "%");
    console.log("   link:  /r/" + team.code);
  } catch (err) {
    if (err && err.code === "P2002") {
      console.error("error: a team with code '" + code + "' already exists");
      process.exit(2);
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
})().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
