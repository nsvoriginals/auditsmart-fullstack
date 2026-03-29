// ── POST /api/payment/razorpay/create-order ───────────────────────────────────
// Equivalent to @router.post("/razorpay/create-order") in payment.py
// Creates a subscription plan order (pro / enterprise)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getRazorpayClient } from "@/lib/audit-helpers";
import { PLAN_PRICES_PAISE, PLAN_FEATURES, config } from "@/lib/config";

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { plan } = body as { plan?: string };

    if (!plan || !(plan in PLAN_PRICES_PAISE)) {
      return NextResponse.json(
        { detail: "Invalid plan. Choose 'pro' or 'enterprise'." },
        { status: 400 }
      );
    }

    const client = getRazorpayClient();
    if (!client) {
      return NextResponse.json(
        { detail: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const order = await client.orders.create({
      amount:   PLAN_PRICES_PAISE[plan],
      currency: "INR",
      notes: {
        user_id: user._id.toString(),
        plan,
        email:   user.email ?? "",
      },
    });

    return NextResponse.json({
      order_id:  order.id,
      amount:    PLAN_PRICES_PAISE[plan],
      currency:  "INR",
      key_id:    config.RAZORPAY_KEY_ID,
      plan,
      features:  PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] ?? {},
    });
  } catch (err) {
    console.error("❌ /api/payment/razorpay/create-order error:", err);
    return NextResponse.json(
      { detail: `Payment error: ${String(err)}` },
      { status: 500 }
    );
  }
}