// ── GET /api/payment/plans ────────────────────────────────────────────────────
// Equivalent to @router.get("/plans") in payment.py — public, no auth required

import { NextResponse } from "next/server";
import { PLAN_FEATURES } from "@/lib/config";

export async function GET() {
  // Separate base plans from add-ons (mirrors Python dict comprehension)
  const plans = Object.fromEntries(
    Object.entries(PLAN_FEATURES).filter(
      ([, v]) => !(v as Record<string, unknown>).is_addon
    )
  );

  return NextResponse.json({
    plans,
    addons: {
      deep_audit: {
        ...PLAN_FEATURES.deep_audit,
        tagline:  "Available on any plan — Claude Opus + See AI Thinking",
        best_for: "Pre-mainnet deployment, high-value DeFi contracts",
      },
    },
  });
}