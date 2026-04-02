// app/api/payment/plans/route.ts - Alternative simpler fix
import { NextResponse } from "next/server";
import { PLAN_FEATURES } from "@/lib/config";

export async function GET() {
  // Separate base plans from add-ons
  const plans: Record<string, any> = {};
  const addons: Record<string, any> = {};

  for (const [key, value] of Object.entries(PLAN_FEATURES)) {
    if ((value as any).is_addon) {
      addons[key] = value;
    } else {
      plans[key] = value;
    }
  }

  return NextResponse.json({
    plans,
    addons: {
      deep_audit: {
        ...PLAN_FEATURES.deep_audit,
        tagline: "Available on any plan — Claude Opus + See AI Thinking",
        best_for: "Pre-mainnet deployment, high-value DeFi contracts",
      },
    },
  });
}