// app/api/audit/scan/route.ts
//
// The API ONLY enqueues. All analysis runs in services/worker via BullMQ.
// This route: authenticates → validates → atomically creates the audit row,
// the audit-job tracking row, and increments usage → enqueues → returns 202.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueAudit, QUEUES } from "@/lib/queue/producer";
import type { AuditJobData, AuditPlan } from "@auditsmart/shared";
import { nanoid } from "nanoid";

// ── Constants ─────────────────────────────────────────────────────────────
const MAX_CONTRACT_SIZE = 50_000; // 50KB
const FREE_PLAN_LIFETIME_LIMIT = 3;
const PRO_PLAN_MONTHLY_LIMIT = 15;
const ENTERPRISE_PLAN_MONTHLY_LIMIT = 20;

// Test file detection patterns
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
  contracts: ["contract.*Test", "contract.*Script"],
};

function detectTestFile(code: string): { isTest: boolean; reasons: string[] } {
  const reasons: string[] = [];
  TEST_FILE_PATTERNS.imports.forEach((p) => {
    if (code.includes(p)) reasons.push(`Contains test import: ${p}`);
  });
  TEST_FILE_PATTERNS.functions.forEach((p) => {
    if (code.includes(p)) reasons.push(`Contains test function: ${p}`);
  });
  TEST_FILE_PATTERNS.contracts.forEach((p) => {
    if (new RegExp(p, "i").test(code)) reasons.push(`Contains test contract: ${p}`);
  });
  return { isTest: reasons.length > 0, reasons };
}

function generateReportId(): string {
  return `AS-2026-${nanoid(10)}`;
}

// Valid on-chain targets (matches Prisma ChainType enum).
const VALID_CHAINS = [
  "ETHEREUM", "BSC", "POLYGON", "AVALANCHE", "ARBITRUM", "OPTIMISM", "BASE",
] as const;
type ChainUpper = (typeof VALID_CHAINS)[number];

function normalizeChain(raw: string): ChainUpper | null {
  const upper = raw.toUpperCase();
  return (VALID_CHAINS as readonly string[]).includes(upper)
    ? (upper as ChainUpper)
    : null;
}

// Map subscription plan (UserRole) → pipeline plan identifier.
function mapPlanToAuditPlan(role: string): AuditPlan {
  switch (role.toUpperCase()) {
    case "PREMIUM": return "pro";
    case "ENTERPRISE": return "enterprise";
    case "ADMIN": return "enterprise";
    default: return "free";
  }
}

// ── Route handler ─────────────────────────────────────────────────────────
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
      erc_standards = [],
    } = body as {
      contract_code?: string;
      contract_name?: string;
      chain?: string;
      erc_standards?: string[];
    };

    // ── Cheap validation (no DB) ──────────────────────────────────────────
    if (!contract_code || contract_code.trim().length === 0) {
      return NextResponse.json({ error: "Contract code is required" }, { status: 400 });
    }

    const testDetection = detectTestFile(contract_code);
    if (testDetection.isTest) {
      return NextResponse.json({
        error: "TEST_FILE_DETECTED",
        message: "This appears to be a test file, not a production contract.",
        details: testDetection.reasons.slice(0, 3),
        userMessage: "Cannot audit test files. Please upload a production Solidity contract.",
      }, { status: 400 });
    }

    if (contract_code.length > MAX_CONTRACT_SIZE) {
      const sizeKB = (contract_code.length / 1000).toFixed(1);
      return NextResponse.json({
        error: "CONTRACT_TOO_LARGE",
        message: `Contract too large. Maximum size is 50KB. Your contract is ${sizeKB}KB.`,
        maxSize: MAX_CONTRACT_SIZE,
        currentSize: contract_code.length,
      }, { status: 400 });
    }

    const chainUpper = normalizeChain(chain);
    if (!chainUpper) {
      return NextResponse.json({
        error: "INVALID_CHAIN",
        message: `Unsupported chain "${chain}". Supported: ${VALID_CHAINS.join(", ")}.`,
      }, { status: 400 });
    }

    // ── Plan + limit checks ───────────────────────────────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [user, monthlyUserAudits] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } }),
      prisma.audit.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    if (plan !== "FREE" && subscription.status !== "ACTIVE") {
      return NextResponse.json({
        error: "SUBSCRIPTION_INACTIVE",
        message: "Your subscription is no longer active. Please renew to continue.",
        upgradeUrl: "/dashboard/billing",
      }, { status: 403 });
    }

    const totalUserAudits =
      plan === "FREE" ? await prisma.audit.count({ where: { userId } }) : monthlyUserAudits;

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
    if (plan === "ENTERPRISE" && monthlyUserAudits >= ENTERPRISE_PLAN_MONTHLY_LIMIT) {
      return NextResponse.json({
        error: "PLAN_LIMIT_EXCEEDED",
        message: `You've used ${monthlyUserAudits}/${ENTERPRISE_PLAN_MONTHLY_LIMIT} audits this month. Contact sales for unlimited.`,
        limitReached: true,
        currentUsage: monthlyUserAudits,
        limit: ENTERPRISE_PLAN_MONTHLY_LIMIT,
      }, { status: 403 });
    }

    const reportId = generateReportId();

    // ── Atomic: create audit + job row + increment usage in ONE transaction ──
    // Usage is incremented here (exactly-once at enqueue) rather than in the
    // worker (at-least-once), so retries never double-count billing/quota.
    const audit = await prisma.$transaction(async (tx) => {
      const created = await tx.audit.create({
        data: {
          userId,
          contractName: contract_name,
          contractCode: contract_code, // full source — worker needs it all
          chain: chainUpper,
          status: "PENDING",
          score: 0,
          reportId,
        },
      });

      await tx.auditJob.create({
        data: {
          auditId: created.id,
          queueName: QUEUES.AUDIT_FAST,
          jobId: `audit:${created.id}`,
          status: "queued",
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { totalAudits: { increment: 1 }, currentMonthAudits: { increment: 1 } },
      });

      return created;
    });

    // ── Enqueue (outside the transaction) ─────────────────────────────────
    const jobData: AuditJobData = {
      auditId: audit.id,
      contractCode: contract_code,
      contractName: contract_name,
      chain: chainUpper,
      plan: mapPlanToAuditPlan(plan),
      ercStandards: erc_standards,
      priority: plan === "FREE" ? 5 : 1, // paid plans jump the queue
    };

    try {
      await enqueueAudit(jobData);
    } catch (err) {
      // Enqueue failed (Redis down). Roll back the usage increment and mark
      // the audit failed so the user isn't charged for work that never ran.
      console.error("Failed to enqueue audit:", err);
      await prisma.$transaction([
        prisma.audit.update({
          where: { id: audit.id },
          data: { status: "FAILED", summary: "Could not start audit. Please try again." },
        }),
        prisma.auditJob.updateMany({
          where: { jobId: `audit:${audit.id}` },
          data: { status: "failed", lastError: "enqueue failed" },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { totalAudits: { decrement: 1 }, currentMonthAudits: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json(
        { error: "QUEUE_UNAVAILABLE", message: "Unable to start audit. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      job_id: audit.id,
      report_id: reportId,
      status: "PENDING",
      message: "Audit queued. Poll /api/audit/results/{job_id} for status.",
      estimated_time_seconds: 60,
      status_url: `/api/audit/results/${audit.id}`,
    }, { status: 202 });
  } catch (error: any) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "SCAN_FAILED", message: "Unable to start audit. Please try again." },
      { status: 500 }
    );
  }
}
