// app/api/audit/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";
import { AgentType, FindingSeverity } from "@prisma/client";

// ── Type helpers ─────────────────────────────────────────────────────────────

function mapAgentType(agentName: string): AgentType {
  const mapping: Record<string, AgentType> = {
    reentrancy_agent:     AgentType.REENTRANCY_AGENT,
    overflow_agent:       AgentType.OVERFLOW_AGENT,
    access_control_agent: AgentType.ACCESS_CONTROL_AGENT,
    logic_agent:          AgentType.LOGIC_AGENT,
    gas_dos_agent:        AgentType.GAS_DOS_AGENT,
    defi_agent:           AgentType.DEFI_AGENT,
    backdoor_agent:       AgentType.BACKDOOR_AGENT,
    signature_agent:      AgentType.SIGNATURE_AGENT,
    slither_agent:        AgentType.SLITHER_AGENT,
    gemini_agent:         AgentType.GEMINI_AGENT,
    claude_pro:           AgentType.CLAUDE_AGENT,
    claude_enterprise:    AgentType.CLAUDE_AGENT,
    claude_deep_audit:    AgentType.CLAUDE_AGENT,
    claude_free:          AgentType.CLAUDE_AGENT,
    security:             AgentType.SECURITY,
  };

  return mapping[agentName?.toLowerCase()] ?? AgentType.SECURITY;
}

function mapSeverity(severity: string): FindingSeverity {
  const map: Record<string, FindingSeverity> = {
    critical: FindingSeverity.CRITICAL,
    high:     FindingSeverity.HIGH,
    medium:   FindingSeverity.MEDIUM,
    low:      FindingSeverity.LOW,
    info:     FindingSeverity.INFO,
  };

  return map[severity?.toLowerCase()] ?? FindingSeverity.INFO;
}

interface RawFinding {
  description?: string;
  title?: string;
  severity?: string;
  source?: string;
  type?: string;
  line?: string | number;
  code_snippet?: string;
  recommendation?: string;
}

function isValidFinding(finding: RawFinding): boolean {
  const skipPatterns = [
    "no vulnerabilities found",
    "no issues found",
    "no gas griefing",
    "no selfdestruct",
    "no delegatecall",
    "no quorum",
    "no migration functions",
    "not directly related",
    "does not utilize",
    "does not contain",
    "no operation",
    "no arithmetic",
  ];

  const description = finding.description?.toLowerCase() ?? "";
  const title = finding.title?.toLowerCase() ?? "";

  for (const pattern of skipPatterns) {
    if (description.includes(pattern) || title.includes(pattern)) return false;
  }

  const severity = finding.severity?.toLowerCase();
  return severity === "critical" || severity === "high" || severity === "medium";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const {
      contract_code,
      contract_name = "Smart Contract",
      chain = "ethereum",
    } = body as { contract_code?: string; contract_name?: string; chain?: string };

    if (!contract_code || contract_code.trim().length === 0) {
      return NextResponse.json({ error: "Contract code is required" }, { status: 400 });
    }

    // ── Subscription: auto-create free tier if missing ───────────────────────
    let subscription = await prisma.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const plan = subscription.plan.toLowerCase(); // "free" | "premium" | "enterprise"

    // ── Free plan monthly limit ──────────────────────────────────────────────
    if (plan === "free") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyAudits = await prisma.audit.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });

      if (monthlyAudits >= 3) {
        return NextResponse.json(
          {
            error: "Free plan limit reached (3 audits/month). Please upgrade to continue.",
            limitReached: true,
            currentUsage: monthlyAudits,
            limit: 3,
          },
          { status: 403 }
        );
      }
    }

    // ── Create audit record ──────────────────────────────────────────────────
    const chainUpper = chain.toUpperCase() as
      | "ETHEREUM" | "BSC" | "POLYGON" | "AVALANCHE" | "ARBITRUM" | "OPTIMISM" | "BASE";

    const audit = await prisma.audit.create({
      data: {
        userId,
        contractName: contract_name,
        contractCode: contract_code.slice(0, 10_000),
        chain: chainUpper,
        status: "PROCESSING",
        score: 0,
      },
    });

    // ── Run pipeline ─────────────────────────────────────────────────────────
    const result = await runAuditPipeline(contract_code, contract_name, plan);

    // ── Persist results ──────────────────────────────────────────────────────
    await prisma.audit.update({
      where: { id: audit.id },
      data: {
        status: "COMPLETED",
        score: result.risk_score,
        summary: result.summary,
        report: JSON.stringify({
          risk_level:       result.risk_level,
          risk_score:       result.risk_score,
          total_findings:   result.total_findings,
          critical_count:   result.critical_count,
          high_count:       result.high_count,
          medium_count:     result.medium_count,
          low_count:        result.low_count,
          info_count:       result.info_count,
          findings:         result.findings,
          deployment_verdict: result.deployment_verdict,
          scan_duration_ms: result.scan_duration_ms,
          plan_used:        result.plan_used,
          pdf_available:    result.pdf_available,
        }),
        completedAt: new Date(),
      },
    });

    // ── Persist individual findings ──────────────────────────────────────────
    const rawFindings: RawFinding[] = result.findings ?? [];
    const validFindings = rawFindings.filter(isValidFinding).map((f) => ({
      auditId:        audit.id,
      agentType:      mapAgentType(f.source ?? ""),
      title:          f.type ?? "Unknown Issue",
      description:    f.description ?? "",
      severity:       mapSeverity(f.severity ?? ""),
      lineNumber:     f.line ? parseInt(String(f.line), 10) : null,
      codeSnippet:    f.code_snippet ?? null,
      recommendation: f.recommendation ?? null,
    }));

    if (validFindings.length > 0) {
      await prisma.finding.createMany({ data: validFindings });
    }

    // ── Increment user audit counters ────────────────────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalAudits:        { increment: 1 },
        currentMonthAudits: { increment: 1 },
      },
    });

    return NextResponse.json({
      id:                 audit.id,
      contract_name,
      risk_level:         result.risk_level,
      risk_score:         result.risk_score,
      total_findings:     result.total_findings,
      critical_count:     result.critical_count,
      high_count:         result.high_count,
      medium_count:       result.medium_count,
      low_count:          result.low_count,
      info_count:         result.info_count,
      findings:           rawFindings.filter(isValidFinding),
      summary:            result.summary,
      deployment_verdict: result.deployment_verdict,
      scan_duration_ms:   result.scan_duration_ms,
      pdf_available:      result.pdf_available,
      plan_used:          result.plan_used,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}