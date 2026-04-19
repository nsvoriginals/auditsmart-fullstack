// app/api/audit/history/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawAudits = await prisma.audit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        contractName: true,
        chain: true,
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

      const findings: any[] = report.findings ?? [];

      return {
        id: a.id,
        contract_name: a.contractName || "Unnamed Contract",
        chain: a.chain?.toLowerCase() || "ethereum",
        status: a.status,
        risk_level: riskLevel,
        risk_score: riskScore,
        total_findings: report.total_findings ?? findings.length,
        critical_count: report.critical_count ?? findings.filter((f: any) => f.severity?.toLowerCase() === "critical").length,
        high_count: report.high_count ?? findings.filter((f: any) => f.severity?.toLowerCase() === "high").length,
        medium_count: report.medium_count ?? findings.filter((f: any) => f.severity?.toLowerCase() === "medium").length,
        low_count: report.low_count ?? findings.filter((f: any) => f.severity?.toLowerCase() === "low").length,
        plan_used: report.plan_used || "free",
        deployment_verdict: report.deployment_verdict || "",
        scan_duration_ms: report.scan_duration_ms || 0,
        pdf_available: true,
        created_at: a.createdAt.toISOString(),
        completed_at: a.completedAt?.toISOString() || null,
      };
    });

    return NextResponse.json({ audits });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}