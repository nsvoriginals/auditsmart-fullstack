// app/api/audit/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAuditPipeline } from "@/lib/agents/pipeline";

// Map agent names to valid database values
function mapAgentType(agentName: string): string {
  const mapping: Record<string, string> = {
    'reentrancy_agent': 'REENTRANCY_AGENT',
    'overflow_agent': 'OVERFLOW_AGENT',
    'access_control_agent': 'ACCESS_CONTROL_AGENT',
    'logic_agent': 'LOGIC_AGENT',
    'gas_dos_agent': 'GAS_DOS_AGENT',
    'defi_agent': 'DEFI_AGENT',
    'backdoor_agent': 'BACKDOOR_AGENT',
    'signature_agent': 'SIGNATURE_AGENT',
    'slither_agent': 'SLITHER_AGENT',
    'gemini_agent': 'GEMINI_AGENT',
    'claude_pro': 'CLAUDE_AGENT',
    'claude_enterprise': 'CLAUDE_AGENT',
    'claude_deep_audit': 'CLAUDE_AGENT',
    'claude_free': 'CLAUDE_AGENT',
    'security': 'SECURITY',
  };
  
  const mapped = mapping[agentName?.toLowerCase()];
  return mapped || 'SECURITY';
}

// Map severity to valid enum values
function mapSeverity(severity: string): string {
  const severityMap: Record<string, string> = {
    'critical': 'CRITICAL',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
    'info': 'INFO',
  };
  
  const mapped = severityMap[severity?.toLowerCase()];
  return mapped || 'INFO';
}

// Filter out low-quality findings
function isValidFinding(finding: any): boolean {
  // Skip findings that are just "no issues found"
  const skipPatterns = [
    'no vulnerabilities found',
    'no issues found',
    'no gas griefing',
    'no selfdestruct',
    'no delegatecall',
    'no quorum',
    'no migration functions',
    'not directly related',
    'does not utilize',
    'does not contain',
    'no operation',
    'no arithmetic',
  ];
  
  const description = finding.description?.toLowerCase() || '';
  const title = finding.title?.toLowerCase() || '';
  
  for (const pattern of skipPatterns) {
    if (description.includes(pattern) || title.includes(pattern)) {
      return false;
    }
  }
  
  // Only keep CRITICAL, HIGH, and MEDIUM findings (skip LOW and INFO)
  const severity = finding.severity?.toLowerCase();
  return severity === 'critical' || severity === 'high' || severity === 'medium';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
    
    console.log("🔑 API Keys check:");
    console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Present" : "❌ Missing");
    console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Present" : "❌ Missing");
    console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✅ Present" : "❌ Missing");
    
    const userId = session.user.id;
    const body = await req.json();
    const { 
      contract_code, 
      contract_name = "Smart Contract", 
      chain = "ethereum" 
    } = body;

    if (!contract_code || contract_code.trim().length === 0) {
      return NextResponse.json(
        { error: "Contract code is required" },
        { status: 400 }
      );
    }

    // Get user's subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // If no subscription exists, create one for free tier
    if (!subscription) {
      console.log("Creating free subscription for user:", userId);
      subscription = await prisma.subscription.create({
        data: {
          userId: userId,
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const plan = subscription?.plan?.toLowerCase() || "free";

    // Check free plan limits
    if (plan === "free") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyAudits = await prisma.audit.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth }
        }
      });

      console.log(`Free plan usage: ${monthlyAudits}/3 audits this month`);

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
        contractName: contract_name,
        contractCode: contract_code.slice(0, 10000),
        chain: chain.toUpperCase(),
        status: "PROCESSING",
        score: 0,
      }
    });

    console.log(`Audit created: ${audit.id}`);

    // Run the audit pipeline
    const result = await runAuditPipeline(contract_code, contract_name, plan);

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
          info_count: result.info_count,
          findings: result.findings,
          deployment_verdict: result.deployment_verdict,
          scan_duration_ms: result.scan_duration_ms,
          plan_used: result.plan_used,
          pdf_available: result.pdf_available,
        }),
        completedAt: new Date(),
      }
    });

    // Create individual findings - with filtering and mapping
    if (result.findings && result.findings.length > 0) {
      // Filter and map findings
      const validFindings = result.findings
        .filter(isValidFinding)
        .map((finding: any) => ({
          auditId: audit.id,
          agentType: mapAgentType(finding.source),
          title: finding.type || "Unknown Issue",
          description: finding.description || "",
          severity: mapSeverity(finding.severity),
          lineNumber: finding.line ? parseInt(finding.line) : null,
          codeSnippet: finding.code_snippet || null,
          recommendation: finding.recommendation || null,
        }));

      console.log(`Findings: ${result.findings.length} raw → ${validFindings.length} valid`);

      if (validFindings.length > 0) {
        await prisma.finding.createMany({
          data: validFindings
        });
      }
    }

    // Return response in the format expected by the frontend
    return NextResponse.json({
      id: audit.id,
      contract_name: contract_name,
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      total_findings: result.total_findings,
      critical_count: result.critical_count,
      high_count: result.high_count,
      medium_count: result.medium_count,
      low_count: result.low_count,
      info_count: result.info_count,
      findings: result.findings?.filter(isValidFinding) || [],
      summary: result.summary,
      deployment_verdict: result.deployment_verdict,
      scan_duration_ms: result.scan_duration_ms,
      pdf_available: result.pdf_available,
      plan_used: result.plan_used,
    });

  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}