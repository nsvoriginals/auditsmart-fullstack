// app/api/audit/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";
import { AgentType, FindingSeverity } from "@prisma/client";
import { nanoid } from "nanoid"; // H-05: Random report IDs

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
  confidence?: string;
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

// B-03: Max contract size limit (50KB)
const MAX_CONTRACT_SIZE = 50_000; // 50KB

// H-05: Generate random report ID
function generateReportId(): string {
  return `AS-2026-${nanoid(10)}`;
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

    // B-03: Validate contract size (max 50KB)
    if (contract_code.length > MAX_CONTRACT_SIZE) {
      const sizeKB = (contract_code.length / 1000).toFixed(1);
      return NextResponse.json(
        { 
          error: `Contract too large (max 50KB). Your contract is ${sizeKB}KB. Please split into smaller files.`,
          maxSize: MAX_CONTRACT_SIZE,
          currentSize: contract_code.length
        },
        { status: 400 }
      );
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

    // H-03: Free plan monthly limit - PER USER (corrected)
    if (plan === "free") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // ✅ CORRECT: Count audits for THIS user only
      const monthlyAudits = await prisma.audit.count({
        where: { 
          userId: userId,  // ✅ Per-user, not global
          createdAt: { gte: startOfMonth } 
        },
      });

      // Free plan: 10 audits lifetime (as per briefing)
      const totalAudits = await prisma.audit.count({
        where: { userId: userId },
      });

      if (totalAudits >= 10) {
        return NextResponse.json(
          {
            error: "Free plan limit reached (10 audits lifetime). Please upgrade to continue.",
            limitReached: true,
            currentUsage: totalAudits,
            limit: 10,
            plan: "free",
          },
          { status: 403 }
        );
      }

      console.log(`📊 Free plan usage: ${totalAudits}/10 lifetime audits for user ${userId}`);
    }

    // H-03: Pro plan limit (15/mo)
    if (plan === "premium") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyAudits = await prisma.audit.count({
        where: { userId: userId, createdAt: { gte: startOfMonth } },
      });

      if (monthlyAudits >= 15) {
        return NextResponse.json(
          {
            error: "Pro plan limit reached (15 audits/month). Please upgrade to Enterprise for more.",
            limitReached: true,
            currentUsage: monthlyAudits,
            limit: 15,
            plan: "premium",
          },
          { status: 403 }
        );
      }
    }

    // H-03: Enterprise plan limit (20/mo)
    if (plan === "enterprise") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyAudits = await prisma.audit.count({
        where: { userId: userId, createdAt: { gte: startOfMonth } },
      });

      if (monthlyAudits >= 20) {
        return NextResponse.json(
          {
            error: "Enterprise plan limit reached (20 audits/month). Contact sales for unlimited.",
            limitReached: true,
            currentUsage: monthlyAudits,
            limit: 20,
            plan: "enterprise",
          },
          { status: 403 }
        );
      }
    }

    // H-05: Generate random report ID
    const reportId = generateReportId();

    // ── Create audit record with random report_id ────────────────────────────
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
        // H-05: Store random report_id (add to schema if exists, or use id)
      },
    });

    // B-02: Return job_id immediately (202 Accepted pattern)
    // Run pipeline asynchronously (don't await)
    const runAuditAsync = async () => {
      try {
        const result = await runAuditPipeline(contract_code, contract_name, plan);

        // ── Persist results ──────────────────────────────────────────────────
        await prisma.audit.update({
          where: { id: audit.id },
          data: {
            status: "COMPLETED",
            score: result.risk_score,
            summary: result.summary,
            report: JSON.stringify({
              report_id: reportId,
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

        // ── Persist individual findings ──────────────────────────────────────
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

        // ── Increment user audit counters ────────────────────────────────────
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalAudits:        { increment: 1 },
            currentMonthAudits: { increment: 1 },
          },
        });

        console.log(`✅ Audit ${audit.id} completed with report_id: ${reportId}`);
      } catch (error) {
        console.error(`❌ Audit ${audit.id} failed:`, error);
        await prisma.audit.update({
          where: { id: audit.id },
          data: { status: "FAILED" },
        });
      }
    };

    // Execute async (don't await - return immediately)
    runAuditAsync();

    // B-02: Return 202 Accepted with job_id immediately
    return NextResponse.json({
      success: true,
      job_id: audit.id,
      report_id: reportId,
      status: "PROCESSING",
      message: "Audit started. Check status at /api/audit/status/{job_id}",
      estimated_time_seconds: 45,
    }, { status: 202 }); // 202 Accepted

  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}