#!/usr/bin/env node
// Wrapper around `prisma migrate deploy` that auto-derives DIRECT_URL from
// DATABASE_URL by stripping Neon's `-pooler` hostname segment.
//
// Why: Neon's pooled endpoint doesn't support PG advisory locks, so
// `prisma migrate deploy` reliably times out (P1002) when run against the
// pooler. The recommended fix is a separate DIRECT_URL for migrations.
// Rather than asking ops to set DIRECT_URL in every environment, we
// compute it here from the already-present DATABASE_URL.

const { spawnSync } = require("child_process");

// On Vercel, env vars come from the platform — no .env file to load. Locally
// they live in .env, which Prisma auto-loads but plain Node doesn't. Try to
// load it; silently no-op if dotenv or .env are absent.
try { require("dotenv").config(); } catch { /* dotenv not installed; fine */ }

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[migrate-deploy] DATABASE_URL is not set");
  process.exit(1);
}

// Strip `-pooler.` -> `.` (e.g. ep-foo-pooler.c-5.aws... -> ep-foo.c-5.aws...).
// Non-Neon / already-unpooled URLs pass through unchanged.
const directUrl = dbUrl.includes("-pooler.")
  ? dbUrl.replace("-pooler.", ".")
  : dbUrl;

if (directUrl !== dbUrl) {
  console.log("[migrate-deploy] derived DIRECT_URL by stripping -pooler from DATABASE_URL");
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: directUrl },
});

process.exit(result.status ?? 1);
