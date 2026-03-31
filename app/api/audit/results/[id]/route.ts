// app/api/audit/results/[id]/route.ts
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const audit = await prisma.audit.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        findings: true,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Parse report JSON
    const report = audit.report ? JSON.parse(audit.report) : {};

    return NextResponse.json({
      id: audit.id,
      contractName: audit.contractName,
      status: audit.status,
      score: audit.score,
      summary: audit.summary,
      report: report,
      createdAt: audit.createdAt,
      findings: audit.findings,
    });
  } catch (error) {
    console.error("Error fetching audit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}