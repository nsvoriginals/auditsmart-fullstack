// app/api/audit/report/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePDFReport } from "@/lib/pdf-generator";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const audit = await prisma.audit.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        findings: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Parse stored report JSON (written by scan route — contains full pipeline output)
    const reportData = audit.report ? JSON.parse(audit.report) : {};

    // ── Findings: prefer reportData.findings (full pipeline data with function/line)
    //   Fallback: normalise DB Finding rows so field names match the PDF generator.
    const pipelineFindings: any[] = Array.isArray(reportData.findings) && reportData.findings.length > 0
      ? reportData.findings
      : audit.findings.map((f) => ({
          type:           f.title,
          severity:       f.severity.toLowerCase(),        // DB stores "CRITICAL" → normalise
          function:       "—",                             // not persisted in DB
          line:           f.lineNumber?.toString() ?? "—",
          description:    f.description,
          recommendation: f.recommendation ?? "",
          confidence:     "HIGH",                         // LOW was filtered at save time
        }));

    // Severity counts — prefer stored report values, recompute from findings as fallback
    const countBySev = (sev: string) =>
      pipelineFindings.filter((f) => f.severity?.toLowerCase() === sev).length;

    const criticalCount = reportData.critical_count ?? countBySev("critical");
    const highCount     = reportData.high_count     ?? countBySev("high");
    const mediumCount   = reportData.medium_count   ?? countBySev("medium");
    const lowCount      = reportData.low_count      ?? countBySev("low");
    const infoCount     = reportData.info_count     ?? countBySev("info");

    // Summary — stored on audit row; also try report JSON summary
    const summary =
      audit.summary ||
      reportData.summary ||
      reportData.overall_assessment ||
      "Security audit completed. Review findings below for detailed analysis.";

    // Generate PDF
    const pdfBuffer = await generatePDFReport({
      auditId:          audit.id,
      contractName:     audit.contractName,
      contractCode:     audit.contractCode,
      summary,
      riskScore:        audit.score || reportData.risk_score || 0,
      riskLevel:        reportData.risk_level || "unknown",
      findings:         pipelineFindings,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      scanDuration:     reportData.scan_duration_ms || 0,
      deploymentVerdict: reportData.deployment_verdict || "",
      thinkingChain:    reportData.thinking_chain ?? null,
      userName:         audit.user?.name  || session.user.name  || "User",
      userEmail:        audit.user?.email || session.user.email || "",
      createdAt:        audit.createdAt,
      agentsUsed:       reportData.agents_used ?? [],
    });

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Audit_Report_${audit.contractName.replace(/[^a-z0-9]/gi, "_")}_${audit.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}