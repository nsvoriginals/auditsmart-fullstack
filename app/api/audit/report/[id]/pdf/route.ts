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

    // Parse report data
    const reportData = audit.report ? JSON.parse(audit.report) : {};

    // Generate PDF
    const pdfBuffer = await generatePDFReport({
      auditId: audit.id,
      contractName: audit.contractName,
      contractCode: audit.contractCode,
      summary: audit.summary || "",
      riskScore: audit.score || 0,
      riskLevel: reportData.risk_level || "Unknown",
      findings: audit.findings,
      criticalCount: reportData.critical_count || 0,
      highCount: reportData.high_count || 0,
      mediumCount: reportData.medium_count || 0,
      lowCount: reportData.low_count || 0,
      scanDuration: reportData.scan_duration_ms || 0,
      deploymentVerdict: reportData.deployment_verdict || "",
      thinkingChain: reportData.thinking_chain,
      userName: audit.user?.name || session.user.name || "User",
      userEmail: audit.user?.email || session.user.email || "",
      createdAt: audit.createdAt,
    });

    return new NextResponse(pdfBuffer, {
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