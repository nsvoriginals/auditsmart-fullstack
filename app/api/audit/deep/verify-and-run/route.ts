// ── POST /api/audit/deep/verify-and-run ───────────────────────────────────────
// Equivalent to @router.post("/deep/verify-and-run") in audit.py
// Step 2: verify Razorpay signature → run Claude Opus audit → return full report

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  validateContract,
  verifyRazorpaySignature,
  serializeAuditFull,
} from "@/lib/audit-helpers";
import { runAuditPipeline } from "@/lib/pipeline";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      contract_code,
      contract_name = "Contract",
      chain         = "ethereum",
    } = body as {
      razorpay_order_id?:   string;
      razorpay_payment_id?: string;
      razorpay_signature?:  string;
      contract_code?:       string;
      contract_name?:       string;
      chain?:               string;
    };

    // ── Validate required fields ──────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { detail: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required" },
        { status: 400 }
      );
    }
    if (!contract_code) {
      return NextResponse.json(
        { detail: "contract_code is required" },
        { status: 400 }
      );
    }

    // ── Verify Razorpay signature ─────────────────────────────────────────
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!isValid) {
      return NextResponse.json(
        { detail: "Invalid payment signature. Payment verification failed." },
        { status: 400 }
      );
    }

    // ── Validate contract code ────────────────────────────────────────────
    let code: string;
    try {
      code = validateContract(contract_code);
    } catch (e: unknown) {
      const err = e as { status: number; message: string };
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }

    const db     = await getDb();
    const userId = new ObjectId(user._id.toString());

    // ── Save payment record first (before running expensive audit) ────────
    await db.collection("payments").insertOne({
      user_id:             userId,
      audit_type:          "deep_audit",
      razorpay_order_id,
      razorpay_payment_id,
      amount:              165000,
      currency:            "INR",
      status:              "verified",
      created_at:          new Date(),
    });

    console.log(`💰 Deep Audit payment verified: ${razorpay_payment_id}`);
    console.log(`🚀 Starting Claude Opus audit for: ${contract_name}`);

    // ── Run Claude Opus audit ─────────────────────────────────────────────
    let result;
    try {
      result = await runAuditPipeline({
        contract_code: code,
        contract_name,
        plan: "deep_audit",
      });
    } catch (e) {
      console.error("❌ Deep Audit pipeline error:", e);
      return NextResponse.json(
        { detail: `Audit error: ${String(e)}` },
        { status: 500 }
      );
    }

    // ── Save audit document ───────────────────────────────────────────────
    const auditDoc = {
      user_id:             userId,
      contract_name,
      chain,
      contract_code_hash:  hashCode(code),
      risk_level:          result.risk_level          ?? "unknown",
      risk_score:          result.risk_score           ?? 0,
      total_findings:      result.total_findings       ?? 0,
      raw_findings_count:  result.raw_findings_count   ?? 0,
      critical_count:      result.critical_count       ?? 0,
      high_count:          result.high_count           ?? 0,
      medium_count:        result.medium_count         ?? 0,
      low_count:           result.low_count            ?? 0,
      info_count:          result.info_count           ?? 0,
      findings:            result.findings             ?? [],
      summary:             result.summary              ?? "",
      agents_used:         result.agents_used          ?? [],
      scan_duration_ms:    result.scan_duration_ms     ?? 0,
      pdf_base64:          result.pdf_base64           ?? "",
      pdf_available:       result.pdf_available        ?? false,
      plan_used:           "deep_audit",
      has_fix_suggestions: result.has_fix_suggestions  ?? false,
      deployment_verdict:  result.deployment_verdict   ?? "",
      thinking_chain:      result.thinking_chain,          // Deep Audit exclusive 🧠
      is_deep_audit:       true,
      version:             "3.0",
      created_at:          new Date(),
    };

    const insertResult = await db.collection("audits").insertOne(auditDoc);

    // ── Link payment → audit ──────────────────────────────────────────────
    await db.collection("payments").updateOne(
      { razorpay_payment_id },
      { $set: { audit_id: insertResult.insertedId.toString() } }
    );

    const saved    = { ...auditDoc, _id: insertResult.insertedId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = serializeAuditFull(saved as any);
    response["pdf_available"]       = result.pdf_available       ?? false;
    response["has_fix_suggestions"] = result.has_fix_suggestions ?? false;
    response["deployment_verdict"]  = result.deployment_verdict  ?? "";
    response["is_deep_audit"]       = true;
    response["thinking_chain"]      = result.thinking_chain;   // Show to user

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ /api/audit/deep/verify-and-run error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
  }
  return hash;
}