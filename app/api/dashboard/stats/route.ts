// ── GET /api/dashboard/stats ───────────────────────────────────────────────────
// Equivalent to @router.get("/stats") in dashboard.py

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  // ── Auth guard (replaces Depends(get_current_user)) ──────────────────────
  const { user, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const db     = await getDb();
    const userId = new ObjectId(user._id.toString());

    // ── total_audits count ───────────────────────────────────────────────────
    const total_audits = await db
      .collection("audits")
      .countDocuments({ user_id: userId });

    // ── Aggregation pipeline (mirrors Python pipeline exactly) ───────────────
    const pipeline = [
      { $match: { user_id: userId } },
      {
        $group: {
          _id:   null,
          total_findings:       { $sum: "$total_findings" },
          critical_findings:    { $sum: "$critical_count" },
          high_findings:        { $sum: "$high_count" },
          medium_findings:      { $sum: "$medium_count" },
          low_findings:         { $sum: "$low_count" },
          total_vulnerabilities: {
            $sum: {
              $add: [
                "$critical_count",
                "$high_count",
                "$medium_count",
                "$low_count",
              ],
            },
          },
          // v2.0 — track raw vs deduped counts
          total_raw_findings: {
            $sum: { $ifNull: ["$raw_findings_count", "$total_findings"] },
          },
          avg_risk_score:     { $avg: "$risk_score" },
          avg_scan_duration:  { $avg: "$scan_duration_ms" },
        },
      },
    ];

    const result = await db
      .collection("audits")
      .aggregate(pipeline)
      .toArray();

    const stats = result[0] ?? {
      total_findings:        0,
      critical_findings:     0,
      high_findings:         0,
      medium_findings:       0,
      low_findings:          0,
      total_vulnerabilities: 0,
      total_raw_findings:    0,
      avg_risk_score:        0,
      avg_scan_duration:     0,
    };

    return NextResponse.json({
      total_audits,
      total_findings:        stats.total_findings        ?? 0,
      critical_findings:     stats.critical_findings     ?? 0,
      high_findings:         stats.high_findings         ?? 0,
      medium_findings:       stats.medium_findings       ?? 0,
      low_findings:          stats.low_findings          ?? 0,
      total_vulnerabilities: stats.total_vulnerabilities ?? 0,
      total_raw_findings:    stats.total_raw_findings    ?? 0,
      avg_risk_score:        Math.round((stats.avg_risk_score ?? 0) * 10) / 10,
      avg_scan_duration_ms:  Math.round(stats.avg_scan_duration ?? 0),
      free_audits_remaining: user.free_audits_remaining ?? 0,
      plan:                  user.plan ?? "free",
      version:               "2.0",
    });
  } catch (err) {
    console.error("❌ /api/dashboard/stats error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}