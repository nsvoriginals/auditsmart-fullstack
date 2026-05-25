// app/api/audit/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";
import { AgentType, FindingSeverity } from "@prisma/client";
import { nanoid } from "nanoid";
import { getChain } from "@/lib/chains";
import { getStandard, standardsForChain } from "@/lib/standards";
import { detectLanguage } from "@/lib/contract-language";

// ── Constants ─────────────────────────────────────────────────────────────
const MAX_CONTRACT_SIZE = 50_000; // B-03: 50KB limit
const FREE_PLAN_LIFETIME_LIMIT = 3;
const PRO_PLAN_MONTHLY_LIMIT = 15;
const ENTERPRISE_PLAN_MONTHLY_LIMIT = 20;

// C-05: Test file detection patterns
const TEST_FILE_PATTERNS = {
  imports: [
    "forge-std/Test.sol",
    "hardhat/console.sol",
    "ds-test/test.sol",
    "@std/Test.sol",
    "forge-std/Script.sol",
  ],
  functions: [
    "function setUp()",
    "function test_",
    "function testFuzz_",
    "function invariant_",
  ],
  contracts: [
    "contract.*Test",
    "contract.*Script",
  ],
};

function detectTestFile(code: string): { isTest: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  TEST_FILE_PATTERNS.imports.forEach(pattern => {
    if (code.includes(pattern)) reasons.push(`Contains test import: ${pattern}`);
  });
  
  TEST_FILE_PATTERNS.functions.forEach(pattern => {
    if (code.includes(pattern)) reasons.push(`Contains test function: ${pattern}`);
  });
  
  TEST_FILE_PATTERNS.contracts.forEach(pattern => {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(code)) reasons.push(`Contains test contract: ${pattern}`);
  });
  
  return { isTest: reasons.length > 0, reasons };
}

// H-05: Generate random report ID
function generateReportId(): string {
  return `AS-2026-${nanoid(10)}`;
}

// ── Type helpers ─────────────────────────────────────────────────────────
// Non-EVM specialist agents (tep74_agent, spl_agent, brc20_agent, etc.) don't
// have dedicated AgentType enum values — they all bucket into SECURITY. Only
// agents that already have a Prisma enum get a precise mapping.
function mapAgentType(agentName: string): AgentType {
  const mapping: Record<string, AgentType> = {
    reentrancy_agent: AgentType.REENTRANCY_AGENT,
    overflow_agent: AgentType.OVERFLOW_AGENT,
    access_control_agent: AgentType.ACCESS_CONTROL_AGENT,
    logic_agent: AgentType.LOGIC_AGENT,
    gas_dos_agent: AgentType.GAS_DOS_AGENT,
    defi_agent: AgentType.DEFI_AGENT,
    backdoor_agent: AgentType.BACKDOOR_AGENT,
    signature_agent: AgentType.SIGNATURE_AGENT,
    slither_agent: AgentType.SLITHER_AGENT,
    gemini_agent: AgentType.GEMINI_AGENT,
    claude_pro: AgentType.CLAUDE_AGENT,
    claude_enterprise: AgentType.CLAUDE_AGENT,
    claude_deep_audit: AgentType.CLAUDE_AGENT,
    erc20_agent: AgentType.ERC20_AGENT,
    erc721_agent: AgentType.ERC721_AGENT,
    erc1155_agent: AgentType.ERC1155_AGENT,
    erc4626_agent: AgentType.ERC4626_AGENT,
    erc1967_agent: AgentType.ERC1967_AGENT,
    erc1271_agent: AgentType.ERC1271_AGENT,
  };
  return mapping[agentName?.toLowerCase()] ?? AgentType.SECURITY;
}

function mapSeverity(severity: string): FindingSeverity {
  const map: Record<string, FindingSeverity> = {
    critical: FindingSeverity.CRITICAL,
    high: FindingSeverity.HIGH,
    medium: FindingSeverity.MEDIUM,
    low: FindingSeverity.LOW,
    info: FindingSeverity.INFO,
  };
  return map[severity?.toLowerCase()] ?? FindingSeverity.INFO;
}

interface RawFinding {
  type?: string;
  severity?: string;
  confidence?: string;
  description?: string;
  recommendation?: string;
  line?: string | number;
  function?: string;
  source?: string;
}

function isValidFinding(finding: RawFinding): boolean {
  const skipPatterns = [
    "no vulnerabilities found",
    "no issues found",
    "no critical",
    "no high",
    "not found",
    "does not contain",
    "does not utilize",
  ];
  
  const description = finding.description?.toLowerCase() ?? "";
  
  for (const pattern of skipPatterns) {
    if (description.includes(pattern)) return false;
  }
  
  // H-01: Filter LOW confidence from being saved
  if (finding.confidence === "LOW") return false;
  
  const severity = finding.severity?.toLowerCase();
  return ["critical", "high", "medium", "low", "info"].includes(severity ?? "");
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
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
    const {
      contract_code,
      contract_name = "Smart Contract",
      chain = "ethereum",
      // `standards` is the new multi-chain field. `erc_standards` is kept as a
      // backward-compatible alias for old clients still posting the old name.
      standards: rawStandards,
      erc_standards: legacyStandards,
    } = body as {
      contract_code?: string;
      contract_name?: string;
      chain?: string;
      standards?: string[];
      erc_standards?: string[];
    };
    const standards: string[] = Array.isArray(rawStandards) && rawStandards.length
      ? rawStandards
      : (Array.isArray(legacyStandards) ? legacyStandards : []);

    // Validation
    if (!contract_code || contract_code.trim().length === 0) {
      return NextResponse.json(
        { error: "Contract code is required" },
        { status: 400 }
      );
    }

    // Validate chain — reject unknown chains explicitly instead of silently
    // coercing them to ETHEREUM (the old behavior caused TON/Solana audits to
    // be saved as Ethereum, confusing users).
    const chainConfig = getChain(chain);
    if (!chainConfig) {
      return NextResponse.json({
        error: "UNSUPPORTED_CHAIN",
        message: `Chain "${chain}" is not supported.`,
      }, { status: 400 });
    }

    // Validate that every selected standard exists AND is available on this chain.
    const allowedStandardIds = new Set(standardsForChain(chain).map(s => s.id));
    const invalidStandards = standards.filter(id => !allowedStandardIds.has(id) || !getStandard(id));
    if (invalidStandards.length) {
      return NextResponse.json({
        error: "INVALID_STANDARDS",
        message: `These standards are not valid for ${chainConfig.label}: ${invalidStandards.join(", ")}`,
      }, { status: 400 });
    }

    // C-05: Test file detection - BLOCK IMMEDIATELY (cheap, no DB round-trip)
    const testDetection = detectTestFile(contract_code);
    if (testDetection.isTest) {
      return NextResponse.json({
        error: "TEST_FILE_DETECTED",
        message: "This appears to be a test file, not a production contract.",
        details: testDetection.reasons.slice(0, 3),
        userMessage: "❌ Cannot audit test files. Please upload a production Solidity contract.",
      }, { status: 400 });
    }

    // B-03: Validate contract size (also cheap, no DB)
    if (contract_code.length > MAX_CONTRACT_SIZE) {
      const sizeKB = (contract_code.length / 1000).toFixed(1);
      return NextResponse.json(
        {
          error: "CONTRACT_TOO_LARGE",
          message: `Contract too large. Maximum size is 50KB. Your contract is ${sizeKB}KB.`,
          maxSize: MAX_CONTRACT_SIZE,
          currentSize: contract_code.length,
        },
        { status: 400 }
      );
    }

    // H-03: Compute month boundary once, reuse across parallel queries
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch user+subscription and monthly count in parallel — saves one DB round-trip
    const [userWithSub, monthlyUserAudits] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      }),
      prisma.audit.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      }),
    ]);

    const user = userWithSub;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-create subscription if missing
    let subscription = user.subscription;
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const plan = subscription.plan;

    // Block cancelled paid subscriptions (FREE is always allowed)
    if (plan !== "FREE" && subscription.status !== "ACTIVE") {
      return NextResponse.json({
        error: "SUBSCRIPTION_INACTIVE",
        message: "Your subscription is no longer active. Please renew to continue.",
        upgradeUrl: "/dashboard/billing",
      }, { status: 403 });
    }

    // For FREE plan we also need total lifetime count — fetch only if needed
    const totalUserAudits = plan === "FREE"
      ? await prisma.audit.count({ where: { userId } })
      : monthlyUserAudits;

    // Free plan: 10 lifetime limit
    if (plan === "FREE" && totalUserAudits >= FREE_PLAN_LIFETIME_LIMIT) {
      return NextResponse.json({
        error: "FREE_PLAN_LIMIT_EXCEEDED",
        message: `You've used ${totalUserAudits}/${FREE_PLAN_LIFETIME_LIMIT} free audits. Please upgrade to continue.`,
        limitReached: true,
        currentUsage: totalUserAudits,
        limit: FREE_PLAN_LIFETIME_LIMIT,
        upgradeUrl: "/pricing",
      }, { status: 403 });
    }

    // Pro plan: 15 per month
    if (plan === "PREMIUM" && monthlyUserAudits >= PRO_PLAN_MONTHLY_LIMIT) {
      return NextResponse.json({
        error: "PLAN_LIMIT_EXCEEDED",
        message: `You've used ${monthlyUserAudits}/${PRO_PLAN_MONTHLY_LIMIT} audits this month. Upgrade to Enterprise for more.`,
        limitReached: true,
        currentUsage: monthlyUserAudits,
        limit: PRO_PLAN_MONTHLY_LIMIT,
        upgradeUrl: "/pricing",
      }, { status: 403 });
    }

    // Enterprise plan: 20 per month
    if (plan === "ENTERPRISE" && monthlyUserAudits >= ENTERPRISE_PLAN_MONTHLY_LIMIT) {
      return NextResponse.json({
        error: "PLAN_LIMIT_EXCEEDED",
        message: `You've used ${monthlyUserAudits}/${ENTERPRISE_PLAN_MONTHLY_LIMIT} audits this month. Contact sales for unlimited.`,
        limitReached: true,
        currentUsage: monthlyUserAudits,
        limit: ENTERPRISE_PLAN_MONTHLY_LIMIT,
      }, { status: 403 });
    }

    console.log(`📊 User ${userId} | Plan: ${plan} | Usage: ${totalUserAudits} total, ${monthlyUserAudits} this month`);

    // H-05: Generate random report ID
    const reportId = generateReportId();

    const language = detectLanguage(chain, contract_code);

    // Create audit record — store reportId at creation so public lookups use the index
    const audit = await prisma.audit.create({
      data: {
        userId,
        contractName: contract_name,
        contractCode: contract_code.slice(0, 10000),
        chain: chainConfig.enumValue,
        contractStandard: standards.length ? standards.join(",") : null,
        language,
        status: "PROCESSING",
        score: 0,
        reportId,
      },
    });

    // B-02: Run pipeline asynchronously (don't await)
    const runAuditAsync = async () => {
      try {
        const result = await runAuditPipeline(contract_code, contract_name, plan.toLowerCase(), standards, chain);

        // Update audit with results
        await prisma.audit.update({
          where: { id: audit.id },
          data: {
            status: "COMPLETED",
            score: result.risk_score,
            summary: result.summary,
            report: JSON.stringify({
              report_id:          reportId,
              risk_level:         result.risk_level,
              risk_score:         result.risk_score,
              total_findings:     result.total_findings,
              critical_count:     result.critical_count,
              high_count:         result.high_count,
              medium_count:       result.medium_count,
              low_count:          result.low_count,
              info_count:         result.info_count,
              findings:           result.findings,         // full pipeline findings (function, line, etc.)
              summary:            result.summary,          // executive summary for PDF
              deployment_verdict: result.deployment_verdict,
              scan_duration_ms:   result.scan_duration_ms,
              plan_used:          result.plan_used,
              agents_used:        result.agents_used,
              thinking_chain:     result.thinking_chain,   // deep audit extended thinking
            }),
            completedAt: new Date(),
          },
        });

        // Save individual findings
        const rawFindings: RawFinding[] = result.findings ?? [];
        const validFindings = rawFindings
          .filter(isValidFinding)
          .map((f) => ({
            auditId: audit.id,
            agentType: mapAgentType(f.source ?? ""),
            title: f.type ?? "Unknown Issue",
            description: f.description ?? "",
            severity: mapSeverity(f.severity ?? ""),
            lineNumber: f.line ? parseInt(String(f.line), 10) : null,
            codeSnippet: null,
            recommendation: f.recommendation ?? null,
          }));

        // Findings + user counter are independent — run in parallel
        await Promise.all([
          validFindings.length > 0
            ? prisma.finding.createMany({ data: validFindings })
            : Promise.resolve(),
          prisma.user.update({
            where: { id: userId },
            data: { totalAudits: { increment: 1 }, currentMonthAudits: { increment: 1 } },
          }),
        ]);

        console.log(`✅ Audit ${audit.id} completed | Report ID: ${reportId}`);
      } catch (error: any) {
        console.error(`❌ Audit ${audit.id} failed:`, error);
        
        // H-04: Don't expose error details to user
        await prisma.audit.update({
          where: { id: audit.id },
          data: { 
            status: "FAILED",
            summary: error.message?.includes("TEST_FILE") 
              ? "Test file detected" 
              : "Audit processing failed",
          },
        });
      }
    };

    // Execute async - return immediately
    runAuditAsync();

    // B-02: Return 202 Accepted with job_id
    return NextResponse.json({
      success: true,
      job_id: audit.id,
      report_id: reportId,
      status: "PROCESSING",
      message: "Audit started. Poll /api/audit/results/{job_id} for status.",
      estimated_time_seconds: 45,
      status_url: `/api/audit/results/${audit.id}`,
    }, { status: 202 });

  } catch (error: any) {
    console.error("Scan error:", error);
    
    // H-04: NEVER expose stack traces
    return NextResponse.json(
      { 
        error: "SCAN_FAILED",
        message: "Unable to start audit. Please try again.",
      },
      { status: 500 }
    );
  }
}