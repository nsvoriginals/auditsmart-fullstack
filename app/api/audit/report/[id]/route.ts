// app/api/audit/report/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { id: auditId } = params;

    const audit = await prisma.audit.findFirst({
      where: { id: auditId, userId: session.user.id },
      include: { findings: true },
    });

    if (!audit) {
      return NextResponse.json({ detail: "Audit not found" }, { status: 404 });
    }

    // Parse the report JSON blob
    let report: any = {};
    try {
      if (audit.report) report = JSON.parse(audit.report);
    } catch {
      console.warn(`Failed to parse report for audit ${audit.id}`);
    }

    // Prefer findings from the report blob (includes all pipeline findings).
    // audit.findings (Finding table) only has HIGH/MEDIUM confidence entries —
    // LOW confidence were filtered at save time. Fall back to Finding table if
    // the report blob has no findings (e.g. very old audits before JSON storage).
    const findings =
      (Array.isArray(report.findings) && report.findings.length > 0)
        ? report.findings
        : audit.findings;

    return NextResponse.json({
      id: audit.id,
      contract_name: audit.contractName,
      contract_code: audit.contractCode,
      chain: audit.chain,
      status: audit.status,
      risk_score: report.risk_score ?? audit.score ?? 0,
      summary: audit.summary || report.summary || "",
      findings,
      created_at: audit.createdAt,
      completed_at: audit.completedAt,
      is_deep_audit: report.is_deep_audit === true || report.plan_used === "deep_audit",
    });
  } catch (err) {
    console.error("❌ /api/audit/report/[id] error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}