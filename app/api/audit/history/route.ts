// app/api/audit/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const rawAudits = await prisma.audit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        contractName: true,
        chain: true,
        contractStandard: true,
        language: true,
        status: true,
        score: true,
        summary: true,
        report: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const audits = rawAudits.map((a) => {
      let report: any = {};
      try {
        if (a.report) report = JSON.parse(a.report);
      } catch {}

      const riskScore = report.risk_score ?? a.score ?? 0;
      let riskLevel = report.risk_level;
      if (!riskLevel) {
        if (riskScore >= 70) riskLevel = "critical";
        else if (riskScore >= 40) riskLevel = "high";
        else if (riskScore >= 20) riskLevel = "medium";
        else riskLevel = "low";
      }

      // Use pre-computed counts from the report blob — avoids iterating findings[] in JS
      const criticalCount = report.critical_count ?? 0;
      const highCount = report.high_count ?? 0;
      const mediumCount = report.medium_count ?? 0;
      const lowCount = report.low_count ?? 0;
      const totalFindings = report.total_findings ?? (criticalCount + highCount + mediumCount + lowCount);

      return {
        id: a.id,
        contract_name: a.contractName || "Unnamed Contract",
        chain: a.chain?.toLowerCase() || "ethereum",
        contract_standard: a.contractStandard || null,
        language: a.language || null,
        status: a.status,
        risk_level: riskLevel,
        risk_score: riskScore,
        total_findings: totalFindings,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        plan_used: report.plan_used || "free",
        deployment_verdict: report.deployment_verdict || "",
        scan_duration_ms: report.scan_duration_ms || 0,
        pdf_available: true,
        created_at: a.createdAt.toISOString(),
        completed_at: a.completedAt?.toISOString() || null,
      };
    });

    return NextResponse.json(
      { audits, page, limit },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}