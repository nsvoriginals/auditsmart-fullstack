// app/api/audit/deep/verify-and-run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";

// Helper functions
function validateContract(code: string): string {
  if (!code || code.trim().length === 0) {
    throw new Error("Contract code is required");
  }
  if (code.length > 50000) {
    throw new Error("Contract code exceeds maximum length of 50,000 characters");
  }
  return code.trim();
}

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generatedSignature === signature;
}

// Map plan type to AgentType enum
function getAgentTypeForPlan(plan: string): string {
  switch (plan) {
    case "deep_audit":
      return "CLAUSE_AGENT"; // or "SECURITY" - choose appropriate enum
    case "pro":
      return "CLAUSE_AGENT";
    case "enterprise":
      return "CLAUSE_AGENT";
    default:
      return "SECURITY";
  }
}

// Map severity string to FindingSeverity enum
function getSeverityEnum(severity: string): string {
  const sev = severity?.toUpperCase() || "INFO";
  const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  return validSeverities.includes(sev) ? sev : "INFO";
}

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
    } = body;

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
    } catch (e: any) {
      return NextResponse.json({ detail: e.message }, { status: 400 });
    }

    // Update payment record status if exists
    try {
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "paid" }
      });
    } catch (e) {
      console.log("Payment record not found, continuing...");
    }

    console.log(`💰 Deep Audit payment verified: ${razorpay_payment_id}`);
    console.log(`🚀 Starting Deep Audit for: ${contract_name}`);

    // Run the audit pipeline with deep_audit plan
    const result = await runAuditPipeline(
      code,           // contractCode
      contract_name,  // contractName
      "deep_audit"    // plan - this triggers Claude Opus
    );

    // Get chain type enum
    const chainUpper = chain.toUpperCase();
    const validChains = ["ETHEREUM", "BSC", "POLYGON", "AVALANCHE", "ARBITRUM", "OPTIMISM", "BASE"];
    const chainEnum = validChains.includes(chainUpper) ? chainUpper : "ETHEREUM";

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        userId: userId,
        contractName: contract_name,
        contractCode: code,
        chain: chainEnum as any,
        status: "COMPLETED",
        score: result.risk_score,
        summary: result.summary,
        report: JSON.stringify(result.findings),
        completedAt: new Date(),
      },
    });

    // Create findings separately with proper enum mapping
    if (result.findings && result.findings.length > 0) {
      await prisma.finding.createMany({
        data: result.findings.map((finding: any) => ({
          auditId: audit.id,
          agentType: "CLAUSE_AGENT" as any, // Use valid enum from schema
          title: finding.title || finding.type || "Security Issue",
          description: finding.description || "",
          severity: getSeverityEnum(finding.severity) as any,
          lineNumber: finding.line || finding.line_number ? Number(finding.line || finding.line_number) : null,
          codeSnippet: finding.code_snippet || finding.codeSnippet,
          recommendation: finding.recommendation,
        })),
      });
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
      pdf_available: result.pdf_available || false,
      has_fix_suggestions: result.has_fix_suggestions,
      deployment_verdict: result.deployment_verdict,
      thinking_chain: result.thinking_chain,
      is_deep_audit: true,
      scan_duration_ms: result.scan_duration_ms,
    });
    
  } catch (err) {
    console.error("❌ /api/audit/deep/verify-and-run error:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}