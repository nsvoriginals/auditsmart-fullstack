// ── GET /api/audit/report/[id]/pdf ───────────────────────────────────────────
// Equivalent to @router.get("/report/{audit_id}/pdf") in audit.py
// Returns raw PDF bytes with Content-Disposition: attachment

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  const { id: auditId } = params;

  // ── Validate ObjectId ─────────────────────────────────────────────────────
  let oid: ObjectId;
  try {
    oid = new ObjectId(auditId);
  } catch {
    return NextResponse.json({ detail: "Invalid audit ID" }, { status: 400 });
  }

  try {
    const db     = await getDb();
    const userId = new ObjectId(user._id.toString());

    // Only fetch fields we need — saves memory vs fetching entire doc
    const audit = await db.collection("audits").findOne(
      {
        _id:     oid as unknown,
        user_id: userId as unknown,
      },
      {
        projection: {
          pdf_base64:     1,
          pdf_available:  1,
          contract_name:  1,
          is_deep_audit:  1,
        },
      }
    );

    if (!audit) {
      return NextResponse.json({ detail: "Audit not found" }, { status: 404 });
    }

    if (!audit.pdf_available || !audit.pdf_base64) {
      return NextResponse.json(
        { detail: "PDF not available. Re-run the audit to generate a PDF." },
        { status: 404 }
      );
    }

    // ── Decode base64 → Buffer ────────────────────────────────────────────
    let pdfBytes: Buffer;
    try {
      pdfBytes = Buffer.from(audit.pdf_base64 as string, "base64");
    } catch {
      return NextResponse.json(
        { detail: "Failed to decode PDF data" },
        { status: 500 }
      );
    }

    // ── Build filename (mirrors Python: "DeepAudit_Report_..." / "AuditSmart_Report_...") ──
    const prefix       = audit.is_deep_audit ? "DeepAudit" : "AuditSmart";
    const contractName = (audit.contract_name as string) ?? "Contract";
    const filename     = `${prefix}_Report_${contractName}_${auditId.slice(0, 8)}.pdf`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(pdfBytes.length),
      },
    });
  } catch (err) {
    console.error("❌ /api/audit/report/[id]/pdf error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}