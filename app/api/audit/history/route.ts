// ── GET /api/audit/history ────────────────────────────────────────────────────
// Equivalent to @router.get("/history") in audit.py
// Query param: ?limit=10  (default 10, max 50)

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { serializeAudit } from "@/lib/audit-helpers";
import { ObjectId } from "mongodb";
import type { AuditDocument } from "@/types";

export async function GET(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);

    const db     = await getDb();
    const userId = new ObjectId(user._id.toString());

    // Project out heavy fields — same as Python's `{"pdf_base64": 0, "thinking_chain": 0}`
    const audits = await db
      .collection<AuditDocument>("audits")
      .find(
        { user_id: userId as unknown as string },
        {
          projection: {
            pdf_base64:    0,
            thinking_chain: 0,
          },
        }
      )
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      audits: audits.map((a) => serializeAudit(a)),
    });
  } catch (err) {
    console.error("❌ /api/audit/history error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}