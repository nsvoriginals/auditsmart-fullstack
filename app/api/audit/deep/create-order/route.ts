// ── POST /api/audit/deep/create-order ─────────────────────────────────────────
// Equivalent to @router.post("/deep/create-order") in audit.py
// Step 1 of Deep Audit: create a Razorpay order for ₹1,650 (~$20 USD)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { validateContract, getRazorpayClient } from "@/lib/audit-helpers";
import { config } from "@/lib/config";

// ₹1650 in paise
const DEEP_AUDIT_AMOUNT_PAISE = 165000;

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      contract_code,
      contract_name = "Contract",
      // chain is accepted but only used server-side later
    } = body as {
      contract_code?: string;
      contract_name?: string;
      chain?: string;
    };

    if (!contract_code) {
      return NextResponse.json(
        { detail: "contract_code is required" },
        { status: 400 }
      );
    }

    // Validate contract early so user doesn't pay for invalid code
    try {
      validateContract(contract_code);
    } catch (e: unknown) {
      const err = e as { status: number; message: string };
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }

    // ── Get Razorpay client ───────────────────────────────────────────────
    const client = getRazorpayClient();
    if (!client) {
      return NextResponse.json(
        { detail: "Payment gateway not configured. Contact support." },
        { status: 500 }
      );
    }

    // ── Create order ──────────────────────────────────────────────────────
    const order = await client.orders.create({
      amount:   DEEP_AUDIT_AMOUNT_PAISE,
      currency: "INR",
      notes: {
        user_id:       user._id.toString(),
        audit_type:    "deep_audit",
        contract_name,
        email:         user.email ?? "",
      },
    });

    return NextResponse.json({
      order_id:       order.id,
      amount:         DEEP_AUDIT_AMOUNT_PAISE,
      amount_display: "₹1,650 (~$20 USD)",
      currency:       "INR",
      key_id:         config.RAZORPAY_KEY_ID,
      audit_type:     "deep_audit",
      description:    "AuditSmart Deep Audit — Claude Opus + Extended Thinking",
      features: [
        "Claude Opus — most powerful AI model",
        "Extended Thinking — see AI reasoning chain",
        "Full exploit scenario for every critical/high finding",
        "Production-ready patched code snippets",
        "Deployment verdict: SAFE / CAUTION / DO NOT DEPLOY",
        "Priority processing",
      ],
    });
  } catch (err) {
    console.error("❌ /api/audit/deep/create-order error:", err);
    return NextResponse.json(
      { detail: `Payment error: ${String(err)}` },
      { status: 500 }
    );
  }
}