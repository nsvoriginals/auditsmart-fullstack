// app/ref/[code]/route.ts
// Public individual-referral entry point. Looks up the user's ReferralCode,
// increments its click count, drops a 30-day attribution cookie, and redirects
// to /register. Unknown codes silently fall through so we don't leak existence.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/referrals";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || "").trim();

  const res = NextResponse.redirect(new URL("/register", req.url));

  // Defensive size cap — codes are short alphanumerics; anything bigger is junk.
  if (!code || code.length > 32) return res;

  const refCode = await prisma.referralCode.findUnique({
    where:  { code },
    select: { id: true },
  });

  if (!refCode) return res;

  // Fire-and-forget click increment so it doesn't slow the redirect.
  prisma.referralCode
    .update({ where: { id: refCode.id }, data: { clickCount: { increment: 1 } } })
    .catch(err => console.error("referral click increment failed:", err));

  res.cookies.set(REFERRAL_COOKIE, code, {
    maxAge:   REFERRAL_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
  });

  return res;
}
