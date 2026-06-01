// app/r/[code]/route.ts
// Public team-referral entry point. Looks up the team by code, increments
// click count, drops a 30-day attribution cookie, redirects to /register.
// Unknown codes silently fall through to /register so we don't leak existence.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TEAM_REFERRAL_COOKIE,
  TEAM_REFERRAL_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/teams";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || "").trim();

  const res = NextResponse.redirect(new URL("/register", req.url));

  // Defensive size cap — codes are short alphanumerics; anything bigger is junk.
  if (!code || code.length > 32) return res;

  const team = await prisma.team.findUnique({
    where:  { code },
    select: { id: true, isActive: true },
  });

  if (!team || !team.isActive) return res;

  // Fire-and-forget click increment so it doesn't slow the redirect.
  prisma.team.update({
    where: { id: team.id },
    data:  { clickCount: { increment: 1 } },
  }).catch(err => console.error("team click increment failed:", err));

  res.cookies.set(TEAM_REFERRAL_COOKIE, code, {
    maxAge:   TEAM_REFERRAL_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
  });

  return res;
}
