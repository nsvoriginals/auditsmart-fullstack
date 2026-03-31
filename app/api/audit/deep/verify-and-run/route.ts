// app/api/audit/deep/verify-and-run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  validateContract,
  verifyRazorpaySignature,
} from "@/lib/audit-helpers";
import { runAuditPipeline } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      contract_code,
      contract_name = "Contract",
      chain = "ethereum",
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      contract_code?: string;
      contract_name?: string;
      chain?: string;
    };

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { detail: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required" },
        { status: 400 }
      );
    }
    if (!contract_code) {
      return NextResponse.json(
        { detail: "contract_code is required" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!isValid) {
      return NextResponse.json(
        { detail: "Invalid payment signature. Payment verification failed." },
        { status: 400 }
      );
    }

    // Validate contract code
    let code: string;
    try {
      code = validateContract(contract_code);
    } catch (e: unknown) {
      const err = e as { status: number; message: string };
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }

    // Update payment record status
    await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: "paid" }
    });

    console.log(`💰 Deep Audit payment verified: ${razorpay_payment_id}`);
    console.log(`🚀 Starting Claude Opus audit for: ${contract_name}`);

    // Run Claude Opus audit
    let result;
    try {
      result = await runAuditPipeline({
        contract_code: code,
        contract_name,
        plan: "deep_audit",
      });
    } catch (e) {
      console.error("❌ Deep Audit pipeline error:", e);
      return NextResponse.json(
        { detail: `Audit error: ${String(e)}` },
        { status: 500 }
      );
    }

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        userId: userId,
        contractName: contract_name,
        contractCode: code,
        chain: chain.toUpperCase(),
        status: "COMPLETED",
        score: result.risk_score || 0,
        summary: result.summary || "",
        report: JSON.stringify(result.findings || []),
        completedAt: new Date(),
        findings: {
          create: (result.findings || []).map((finding: any) => ({
            agentType: finding.agent_type || "SECURITY",
            title: finding.title || "",
            description: finding.description || "",
            severity: finding.severity?.toUpperCase() || "MEDIUM",
            lineNumber: finding.line_number,
            codeSnippet: finding.code_snippet,
            recommendation: finding.recommendation,
          }))
        }
      },
    });

    // Link payment to audit
    await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { 
        status: "completed",
        // Add audit reference if you have a field for it
      }
    });

    return NextResponse.json({
      audit_id: audit.id,
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      total_findings: result.total_findings,
      summary: result.summary,
      pdf_available: result.pdf_available,
      has_fix_suggestions: result.has_fix_suggestions,
      deployment_verdict: result.deployment_verdict,
      thinking_chain: result.thinking_chain,
      is_deep_audit: true,
    });
  } catch (err) {
    console.error("❌ /api/audit/deep/verify-and-run error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}