// app/api/audit/results/[id]/route.ts - FIXED
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
    const url = new URL(req.url);
    const isPublic = url.searchParams.get("public") === "true";
    const isPolling = url.searchParams.get("poll") === "true";
    
    // H-05: Public access for report verification via report_id
    const reportId = url.searchParams.get("report_id");
    
    let whereClause: any = {};
    
    if (reportId) {
      // Public report access via random report_id
      whereClause = { report: { contains: reportId } };
    } else if (!isPublic && session?.user?.id) {
      // Private access - must be owner
      whereClause = { id: params.id, userId: session.user.id };
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const audit = await prisma.audit.findFirst({
      where: whereClause,
      include: {
        findings: {
          orderBy: { severity: 'desc' },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // For polling: return minimal status
    if (isPolling) {
      return NextResponse.json({
        job_id: audit.id,
        status: audit.status,
        progress: audit.status === "COMPLETED" ? 100 : 
                  audit.status === "PROCESSING" ? 50 : 0,
        completed: audit.status === "COMPLETED" || audit.status === "FAILED",
      });
    }

    // Parse report JSON
    let report: any = {};
    try {
      if (audit.report) {
        report = JSON.parse(audit.report);
      }
    } catch (e) {
      console.warn(`Failed to parse report for audit ${audit.id}`);
    }

    // ⭐ Extract findings - check multiple possible locations
    const findings = report.findings || audit.findings || [];
    
    // ⭐ Calculate counts if not in report
    const criticalCount = report.critical_count || 
      findings.filter((f: any) => f.severity?.toLowerCase() === 'critical').length;
    const highCount = report.high_count || 
      findings.filter((f: any) => f.severity?.toLowerCase() === 'high').length;
    const mediumCount = report.medium_count || 
      findings.filter((f: any) => f.severity?.toLowerCase() === 'medium').length;
    const lowCount = report.low_count || 
      findings.filter((f: any) => f.severity?.toLowerCase() === 'low').length;
    const infoCount = report.info_count || 
      findings.filter((f: any) => f.severity?.toLowerCase() === 'info').length;

    // Format findings — expose both field aliases so all pages render correctly:
    // scan page uses: type, line, function
    // results page uses: title, lineNumber
    const formattedFindings = findings.map((f: any, index: number) => ({
      id: f.id || `finding-${index}`,
      type: f.type || f.title || "Unknown Issue",
      title: f.title || f.type || "Unknown Issue",
      severity: f.severity?.toLowerCase() || "info",
      description: f.description || "",
      recommendation: f.recommendation || "",
      line: f.lineNumber || f.line || null,
      lineNumber: f.lineNumber || f.line || null,
      function: f.function || null,
    }));

    // ⭐ Determine risk level
    const riskScore = report.risk_score || audit.score || 0;
    let riskLevel = report.risk_level;
    if (!riskLevel) {
      if (riskScore >= 70) riskLevel = "critical";
      else if (riskScore >= 50) riskLevel = "high";
      else if (riskScore >= 30) riskLevel = "medium";
      else riskLevel = "low";
    }

    const deploymentVerdict = report.deployment_verdict || report.deployment_recommendation || "DEPLOY WITH CAUTION";
    const totalFindings = report.total_findings ?? findings.length;
    const hasFix = report.has_fix_suggestions || formattedFindings.some((f: any) => f.recommendation);
    const thinkingChain = report.thinking_chain || report.thinking || null;
    const agentsUsed = report.agents_used || [];
    const scanDuration = report.scan_duration_ms || 0;
    const planUsed = report.plan_used || "free";
    const summaryText = audit.summary || report.summary || report.overall_assessment || "Audit completed.";
    const contractName = audit.contractName || "Unnamed Contract";

    // Return shape satisfies BOTH consumers:
    // - scan page (flat snake_case fields + findings[].type)
    // - results page (audit.contractName + nested audit.report.* + findings[].title)
    return NextResponse.json({
      // Identity
      id: audit.id,
      status: audit.status || "COMPLETED",
      score: audit.score || riskScore,
      summary: summaryText,
      createdAt: audit.createdAt?.toISOString() || new Date().toISOString(),
      completedAt: audit.completedAt?.toISOString() || audit.createdAt?.toISOString() || new Date().toISOString(),
      chain: audit.chain?.toLowerCase() || "ethereum",

      // results page reads audit.contractName
      contractName,
      // scan page reads result.contract_name
      contract_name: contractName,

      // Flat fields — scan page reads these directly off the root
      risk_level: riskLevel,
      risk_score: riskScore,
      total_findings: totalFindings,
      critical_count: criticalCount,
      high_count: highCount,
      medium_count: mediumCount,
      low_count: lowCount,
      info_count: infoCount,
      deployment_verdict: deploymentVerdict,
      scan_duration_ms: scanDuration,
      plan_used: planUsed,
      has_fix_suggestions: hasFix,
      pdf_available: true,
      thinking_chain: thinkingChain,
      agents_used: agentsUsed,

      // Nested report object — results page reads audit.report.*
      report: {
        risk_level: riskLevel,
        risk_score: riskScore,
        total_findings: totalFindings,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        info_count: infoCount,
        deployment_verdict: deploymentVerdict,
        scan_duration_ms: scanDuration,
        plan_used: planUsed,
        has_fix_suggestions: hasFix,
        thinking_chain: thinkingChain,
        agents_used: agentsUsed,
        findings: formattedFindings,
      },

      // findings array at root — both pages read this
      findings: formattedFindings,
    });
    
  } catch (error) {
    console.error("Error fetching audit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}