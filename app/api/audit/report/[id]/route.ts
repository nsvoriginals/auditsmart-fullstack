// ── GET /api/audit/report/[id] ────────────────────────────────────────────────
// Equivalent to @router.get("/report/{audit_id}") in audit.py

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { serializeAuditFull } from "@/lib/audit-helpers";
import { ObjectId } from "mongodb";
import type { AuditDocument } from "@/types";

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

    const audit = await db.collection<AuditDocument>("audits").findOne(
      {
        _id:     oid as unknown as string,
        user_id: userId as unknown as string,
      },
      { projection: { pdf_base64: 0 } }   // strip heavy field, keep thinking_chain
    );

    if (!audit) {
      return NextResponse.json({ detail: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(serializeAuditFull(audit));
  } catch (err) {
    console.error("❌ /api/audit/report/[id] error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}