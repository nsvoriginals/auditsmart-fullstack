// app/api/referrals/route.ts — referral dashboard data for the current user.
// GET returns full stats (minting the user's code on first call).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReferralStats } from "@/lib/referrals";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getReferralStats(session.user.id);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("GET /api/referrals failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
