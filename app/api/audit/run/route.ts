// app/api/audit/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { contractCode, contractName = "Smart Contract", plan = "free" } = body;

    if (!contractCode || contractCode.trim().length === 0) {
      return NextResponse.json(
        { error: "Contract code is required" },
        { status: 400 }
      );
    }

    // 🔍 DEBUG: Log the plan and user
    console.log(`📊 Audit request - User: ${userId}, Plan: ${plan}`);

    // Check free plan limits (ONLY for free plan)
    if (plan === "free") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Count audits this month
      const monthlyAudits = await prisma.audit.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      });

      console.log(`📊 Free plan usage: ${monthlyAudits}/3 audits this month`);

      if (monthlyAudits >= 3) {
        return NextResponse.json(
          { 
            error: "Free plan limit reached (3 audits/month). Please upgrade to continue.",
            limitReached: true,
            currentUsage: monthlyAudits,
            limit: 3
          },
          { status: 403 }
        );
      }
    }

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        userId,
        contractName,
        contractCode: contractCode.slice(0, 10000),
        status: "PROCESSING",
        score: 0,
      }
    });

    console.log(`✅ Audit created: ${audit.id}`);

    // Run the audit pipeline
    const result = await runAuditPipeline(contractCode, contractName, plan);

    // Update audit with results
    const updatedAudit = await prisma.audit.update({
      where: { id: audit.id },
      data: {
        status: "COMPLETED",
        score: result.risk_score,
        summary: result.summary,
        report: JSON.stringify({
          risk_level: result.risk_level,
          risk_score: result.risk_score,
          total_findings: result.total_findings,
          critical_count: result.critical_count,
          high_count: result.high_count,
          medium_count: result.medium_count,
          low_count: result.low_count,
          agents_used: result.agents_used,
          scan_duration_ms: result.scan_duration_ms,
          plan_used: result.plan_used,
          has_fix_suggestions: result.has_fix_suggestions,
          deployment_verdict: result.deployment_verdict,
          thinking_chain: result.thinking_chain,
          findings: result.findings,
        }),
        completedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      audit_id: audit.id,
      ...result,
      findings: result.findings?.slice(0, 50) || [],
    });

  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}