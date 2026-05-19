// app/api/audit/deep/verify-and-run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_DETAILS } from "@/lib/plans";
import { runAuditPipeline } from "@/lib/agents/pipeline";
import { nanoid } from "nanoid";
import { AgentType, FindingSeverity } from "@prisma/client";
import crypto from "crypto";

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      contract_code,
      contract_name = "Contract",
      chain = "ethereum",
    } = body;
    // Note: demo_mode field is intentionally ignored — signature is always verified.

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { detail: "Missing payment verification data" },
        { status: 400 }
      );
    }

    if (!contract_code?.trim()) {
      return NextResponse.json({ detail: "Contract code is required" }, { status: 400 });
    }

    if (contract_code.length > 50000) {
      return NextResponse.json({ detail: "Contract code exceeds 50,000 characters" }, { status: 400 });
    }

    // Verify payment signature
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ detail: "Invalid payment signature" }, { status: 400 });
    }

    console.log(`✅ Deep Audit payment verified: ${razorpay_payment_id}`);
    console.log(`🚀 Starting Deep Audit for: ${contract_name}`);

    const validChains = ["ETHEREUM", "BSC", "POLYGON", "AVALANCHE", "ARBITRUM", "OPTIMISM", "BASE"];
    const chainEnum = validChains.includes(chain.toUpperCase()) ? chain.toUpperCase() : "ETHEREUM";
    const reportId = `AS-DEEP-${nanoid(10)}`;

    // Create audit record immediately — return 202 so the client can poll
    const audit = await prisma.audit.create({
      data: {
        userId: session.user.id,
        contractName: contract_name,
        contractCode: contract_code.trim().slice(0, 10000),
        chain: chainEnum as any,
        status: "PROCESSING",
        score: 0,
        reportId,
      },
    });

    // Record payment immediately (before pipeline runs, idempotent via upsert)
    await prisma.payment.upsert({
      where: { razorpayOrderId: razorpay_order_id },
      update: { status: "paid", razorpayPaymentId: razorpay_payment_id },
      create: {
        userId:            session.user.id,
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount:            PLAN_DETAILS.deep_audit.amountInPaise,
        currency:          "INR",
        status:            "paid",
        plan:              "ENTERPRISE",
      },
    });

    // Run pipeline asynchronously — Claude Opus can take 60-120s which would
    // exceed Vercel's serverless function timeout if awaited synchronously.
    const runDeepAsync = async () => {
      try {
        const result = await runAuditPipeline(contract_code.trim(), contract_name, "deep_audit");

        await prisma.audit.update({
          where: { id: audit.id },
          data: {
            status: "COMPLETED",
            score: result.risk_score,
            summary: result.summary,
            completedAt: new Date(),
            // Store full result object (NOT just findings array) for results page compatibility
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
              findings:           result.findings,
              summary:            result.summary,
              deployment_verdict: result.deployment_verdict,
              scan_duration_ms:   result.scan_duration_ms,
              plan_used:          result.plan_used,
              agents_used:        result.agents_used,
              thinking_chain:     result.thinking_chain,
              is_deep_audit:      true,
              has_fix_suggestions: result.has_fix_suggestions,
            }),
          },
        });

        // Save findings to Finding table
        const validFindings = (result.findings ?? [])
          .filter((f: any) => f.confidence !== "LOW")
          .map((f: any) => ({
            auditId: audit.id,
            agentType: AgentType.CLAUDE_AGENT,
            title: f.type || f.title || "Security Issue",
            description: f.description || "",
            severity: ((f.severity?.toUpperCase() || "INFO") as FindingSeverity),
            lineNumber: f.line ? parseInt(String(f.line), 10) : null,
            codeSnippet: null,
            recommendation: f.recommendation || null,
          }));

        if (validFindings.length > 0) {
          await prisma.finding.createMany({ data: validFindings });
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { totalAudits: { increment: 1 }, currentMonthAudits: { increment: 1 } },
        });

        console.log(`✅ Deep audit ${audit.id} completed`);
      } catch (err) {
        console.error(`❌ Deep audit ${audit.id} failed:`, err);
        await prisma.audit.update({
          where: { id: audit.id },
          data: { status: "FAILED", summary: "Deep audit processing failed." },
        });
      }
    };

    runDeepAsync(); // fire-and-forget

    return NextResponse.json({
      success: true,
      job_id: audit.id,
      report_id: reportId,
      status: "PROCESSING",
      message: "Deep audit started. Poll /api/audit/results/{job_id} for status.",
      estimated_time_seconds: 120,
      status_url: `/api/audit/results/${audit.id}`,
    }, { status: 202 });

  } catch (err) {
    console.error("Deep audit error:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}