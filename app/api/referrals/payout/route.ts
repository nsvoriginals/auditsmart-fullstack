// app/api/referrals/payout/route.ts — update the user's payout preference.
// PATCH { method: "CREDIT" | "CASH", details?: string }
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updatePayoutPreference } from "@/lib/referrals";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { method?: string; details?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const method = body.method;
  if (method !== "CREDIT" && method !== "CASH") {
    return NextResponse.json(
      { error: "method must be 'CREDIT' or 'CASH'" },
      { status: 400 }
    );
  }

  const details = typeof body.details === "string" ? body.details.slice(0, 500) : "";

  // Cash payouts need somewhere to send the money.
  if (method === "CASH" && !details.trim()) {
    return NextResponse.json(
      { error: "Cash payouts require payout details (UPI ID or bank reference)." },
      { status: 400 }
    );
  }

  try {
    await updatePayoutPreference(session.user.id, method, details);
    return NextResponse.json({ success: true, method, details: details.trim() || null });
  } catch (err) {
    console.error("PATCH /api/referrals/payout failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
