// ── POST /api/audit/scan ───────────────────────────────────────────────────────
// Equivalent to @router.post("/scan") in audit.py
//
// free       → Groq + Gemini
// pro        → Groq + Claude Haiku
// enterprise → Groq + Claude Sonnet

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { validateContract, serializeAudit } from "@/lib/audit-helpers";
import { runAuditPipeline } from "@/lib/pipeline";   // your existing pipeline adapter
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      contract_code,
      contract_name = "Contract",
      chain         = "ethereum",
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

    // ── Quota check (mirrors FastAPI quota logic) ─────────────────────────
    const plan       = user.plan ?? "free";
    const auditsLeft = user.free_audits_remaining ?? 0;

    if (auditsLeft <= 0 && plan !== "enterprise") {
      return NextResponse.json(
        {
          error:       "Audit limit reached",
          message:     `Your ${plan} plan limit is reached. Upgrade to continue.`,
          upgrade_url: "/pricing",
        },
        { status: 402 }
      );
    }

    // ── Validate contract ─────────────────────────────────────────────────
    let code: string;
    try {
      code = validateContract(contract_code);
    } catch (e: unknown) {
      const err = e as { status: number; message: string };
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }

    // ── Run pipeline ──────────────────────────────────────────────────────
    let result;
    try {
      result = await runAuditPipeline({ contract_code: code, contract_name, plan });
    } catch (e) {
      console.error("❌ Audit pipeline error:", e);
      return NextResponse.json(
        { detail: `Audit pipeline error: ${String(e)}` },
        { status: 500 }
      );
    }

    // ── Save audit ────────────────────────────────────────────────────────
    const db       = await getDb();
    const userId   = new ObjectId(user._id.toString());
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
      plan_used:           plan,
      has_fix_suggestions: result.has_fix_suggestions  ?? false,
      deployment_verdict:  result.deployment_verdict   ?? "",
      thinking_chain:      result.thinking_chain,
      is_deep_audit:       false,
      version:             "3.0",
      created_at:          new Date(),
    };

    const insertResult = await db.collection("audits").insertOne(auditDoc);

    // ── Deduct quota ──────────────────────────────────────────────────────
    await db.collection("users").updateOne(
      { _id: userId },
      { $inc: { free_audits_remaining: -1 } }
    );

    const saved     = { ...auditDoc, _id: insertResult.insertedId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response  = serializeAudit(saved as any);
    response["pdf_available"]       = result.pdf_available       ?? false;
    response["has_fix_suggestions"] = result.has_fix_suggestions ?? false;
    response["deployment_verdict"]  = result.deployment_verdict  ?? "";

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ /api/audit/scan error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Simple Java-style hash — mirrors Python's hash() for logging purposes only. */
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
  }
  return hash;
}