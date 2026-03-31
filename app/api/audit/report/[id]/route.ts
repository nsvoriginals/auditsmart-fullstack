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
      where: {
        id: auditId,
        userId: session.user.id,
      },
      include: {
        findings: true,
      },
    });

    if (!audit) {
      return NextResponse.json({ detail: "Audit not found" }, { status: 404 });
    }

    // Parse findings from JSON if needed
    const findings = audit.findings || JSON.parse(audit.report || '[]');

    return NextResponse.json({
      id: audit.id,
      contract_name: audit.contractName,
      contract_code: audit.contractCode,
      chain: audit.chain,
      status: audit.status,
      risk_score: audit.score,
      summary: audit.summary,
      findings: findings,
      created_at: audit.createdAt,
      completed_at: audit.completedAt,
      is_deep_audit: audit.contractCode?.includes("deep") || false,
    });
  } catch (err) {
    console.error("❌ /api/audit/report/[id] error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}