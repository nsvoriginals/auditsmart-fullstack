// ── POST /api/payment/razorpay/verify ─────────────────────────────────────────
// Verifies Razorpay signature then calls activateSubscription() which:
//  • Upserts the subscription document
//  • Updates user (plan, quota, is_premium, expires_at)
//  • Records payment
// After this the frontend should call `update()` from useSession() so the
// NextAuth JWT token refreshes with the new plan.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/audit-helpers";
import { activateSubscription } from "@/lib/subscription";
import { PLAN_PRICES_PAISE, PLAN_FEATURES } from "@/lib/config";
import type { SubscriptionPlan } from "@/types";

const VALID_PLANS: SubscriptionPlan[] = ["pro", "enterprise"];

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = body as {
      razorpay_order_id?:   string;
      razorpay_payment_id?: string;
      razorpay_signature?:  string;
      plan?:                string;
    };

    if (!plan || !VALID_PLANS.includes(plan as SubscriptionPlan))
      return NextResponse.json({ detail: "Invalid plan. Choose 'pro' or 'enterprise'." }, { status: 400 });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return NextResponse.json({ detail: "Missing Razorpay payment fields" }, { status: 400 });

    // ── Verify signature ───────────────────────────────────────────────────
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
      return NextResponse.json({ detail: "Invalid payment signature" }, { status: 400 });

    // ── Activate subscription ──────────────────────────────────────────────
    await activateSubscription({
      userId:              user._id.toString(),
      plan:                plan as SubscriptionPlan,
      razorpay_order_id,
      razorpay_payment_id,
      amount_paise:        PLAN_PRICES_PAISE[plan] ?? 0,
    });

    return NextResponse.json({
      status:   "success",
      plan,
      is_premium: true,
      message:  "Subscription activated. Please refresh your session.",
      features: PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] ?? {},
      // Tell the frontend to call update() on the NextAuth session
      refresh_session: true,
    });
  } catch (err) {
    console.error("❌ /api/payment/razorpay/verify:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}