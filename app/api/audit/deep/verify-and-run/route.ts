// app/api/audit/deep/verify-and-run/route.ts (Single clean version)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";
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

    // Run the audit pipeline with deep_audit plan
    const result = await runAuditPipeline(
      contract_code.trim(),
      contract_name,
      "deep_audit"
    );

    // Save to database
    const validChains = ["ETHEREUM", "BSC", "POLYGON", "AVALANCHE", "ARBITRUM", "OPTIMISM", "BASE"];
    const chainEnum = validChains.includes(chain.toUpperCase()) ? chain.toUpperCase() : "ETHEREUM";

    const audit = await prisma.audit.create({
      data: {
        userId: session.user.id,
        contractName: contract_name,
        contractCode: contract_code.trim(),
        chain: chainEnum as any,
        status: "COMPLETED",
        score: result.risk_score,
        summary: result.summary,
        report: JSON.stringify(result.findings),
        completedAt: new Date(),
      },
    });

    // Save findings
    if (result.findings?.length) {
      await prisma.finding.createMany({
        data: result.findings.map((f: any) => ({
          auditId: audit.id,
          agentType: "CLAUDE_AGENT",
          title: f.title || f.type || "Security Issue",
          description: f.description || "",
          severity: (f.severity?.toUpperCase() || "INFO") as any,
          lineNumber: f.line || f.line_number ? Number(f.line || f.line_number) : null,
          codeSnippet: f.code_snippet || f.codeSnippet,
          recommendation: f.recommendation,
        })),
      });
    }

    // Update payment record if exists
    try {
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "paid", razorpayPaymentId: razorpay_payment_id }
      });
    } catch (e) {
      // Payment record might not exist yet - create it
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: 165000,
          currency: "INR",
          status: "paid",
          plan: "PREMIUM",
        }
      }).catch(() => {});
    }

    return NextResponse.json({
      audit_id: audit.id,
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      total_findings: result.total_findings,
      critical_count: result.critical_count,
      high_count: result.high_count,
      medium_count: result.medium_count,
      low_count: result.low_count,
      info_count: result.info_count,
      summary: result.summary,
      pdf_available: result.pdf_available ?? false,
      has_fix_suggestions: result.has_fix_suggestions,
      deployment_verdict: result.deployment_verdict,
      thinking_chain: result.thinking_chain,
      is_deep_audit: true,
      scan_duration_ms: result.scan_duration_ms,
    });

  } catch (err) {
    console.error("Deep audit error:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}