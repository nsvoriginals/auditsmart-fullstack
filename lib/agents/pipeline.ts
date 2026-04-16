// lib/agents/pipeline.ts - FIXED GRACEFUL FAILURE
import { config, AGENT_CONFIGS } from '../config';
import { runGroqAnalysis } from './groq-agent';
import { runGeminiAnalysis } from './gemini-agent';
import { runClaudeAnalysis } from './claude-agent';
import { deduplicateAndValidate } from './dedup-engine';

export interface AuditResult {
  risk_level: string;
  risk_score: number;
  total_findings: number;
  raw_findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  findings: any[];
  summary: string;
  agents_used: string[];
  scan_duration_ms: number;
  plan_used: string;
  has_fix_suggestions: boolean;
  deployment_verdict: string;
  thinking_chain: string | null;
  is_deep_audit: boolean;
  pdf_available?: boolean;
  errors?: string[];  // ⭐ Track errors
}

// C-05: Test file detection
const TEST_IMPORTS = [
  "forge-std/Test.sol",
  "hardhat/console.sol", 
  "ds-test/test.sol",
  "forge-std/Script.sol",
];

function isTestFile(contractCode: string): { isTest: boolean; reason: string } {
  for (const testImport of TEST_IMPORTS) {
    if (contractCode.includes(testImport)) {
      return { isTest: true, reason: `Contains test import: ${testImport}` };
    }
  }
  return { isTest: false, reason: "" };
}

export async function runAuditPipeline(
  contractCode: string,
  contractName: string = "Contract",
  plan: string = "free"
): Promise<AuditResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  console.log("\n" + "=".repeat(65));
  console.log(`🚀 AuditSmart v3.0 | ${contractName} | Plan: ${plan.toUpperCase()}`);
  console.log(`   Contract: ${contractCode.length} chars`);
  console.log("=".repeat(65));

  // C-05: Block test files
  const testCheck = isTestFile(contractCode);
  if (testCheck.isTest) {
    console.log(`❌ BLOCKED: Test file detected - ${testCheck.reason}`);
    throw new Error(`TEST_FILE_DETECTED: ${testCheck.reason}`);
  }

  let allFindings: any[] = [];
  const agentsUsed: string[] = [];

  // ⭐ Phase 1: Run Groq agents with error handling
  console.log("\n📡 Phase 1: Groq agents (parallel)...");
  
  const groqResults = await Promise.allSettled(  // ⭐ Use allSettled instead of all
    AGENT_CONFIGS.map(async (agent) => {
      try {
        const findings = await runGroqAnalysis(contractCode, agent.focus, agent.name);
        if (findings.length) {
          allFindings.push(...findings);
          agentsUsed.push(agent.name);
          console.log(`   ✅ ${agent.name}: ${findings.length} findings`);
        }
        return findings;
      } catch (error: any) {
        errors.push(`${agent.name}: ${error?.message || 'Unknown error'}`);
        console.log(`   ⚠️ ${agent.name}: failed - continuing...`);
        return [];
      }
    })
  );

  // Count successful agents
  const successfulAgents = groqResults.filter(r => r.status === 'fulfilled').length;
  console.log(`\n   Phase 1: ${successfulAgents}/${AGENT_CONFIGS.length} agents succeeded, ${allFindings.length} raw findings`);

  // ⭐ Phase 2: Orchestrator with fallback
  let thinkingChain: string | null = null;
  let claudeVerdict = "";
  let claudeSummary = "";

  if (plan === "free") {
    console.log("\n🤖 Phase 2: Gemini Orchestrator...");
    try {
      const geminiFindings = await runGeminiAnalysis(contractCode);
      if (geminiFindings.length) {
        allFindings.push(...geminiFindings);
        agentsUsed.push("gemini_agent");
        console.log(`   ✅ gemini_agent: ${geminiFindings.length} findings`);
      }
    } catch (error: any) {
      errors.push(`gemini_agent: ${error?.message || 'Unknown error'}`);
      console.log(`   ⚠️ Gemini failed, continuing with Groq findings only`);
    }
  } else if (["pro", "enterprise", "deep_audit"].includes(plan)) {
    const labels: Record<string, string> = {
      pro: "Claude Haiku",
      enterprise: "Claude Sonnet",
      deep_audit: "Claude Opus"
    };
    console.log(`\n🤖 Phase 2: ${labels[plan]}...`);
    
    try {
      const claudeResult = await runClaudeAnalysis(contractCode, allFindings, plan);
      
      if (claudeResult.findings.length) {
        allFindings.push(...claudeResult.findings);
        agentsUsed.push(`claude_${plan}`);
        console.log(`   ✅ claude_${plan}: ${claudeResult.findings.length} additional findings`);
      }
      
      thinkingChain = claudeResult.thinking;
      claudeVerdict = claudeResult.verdict;
      claudeSummary = claudeResult.summary;
    } catch (error: any) {
      errors.push(`claude_${plan}: ${error?.message || 'Unknown error'}`);
      console.log(`   ⚠️ Claude failed, using Groq findings only`);
    }
  }

  // Deduplication
  console.log(`\n🔍 Deduplication: ${allFindings.length} raw → `);
  const uniqueFindings = deduplicateAndValidate(allFindings);
  console.log(`${uniqueFindings.length} unique`);

  // Scoring
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of uniqueFindings) {
    const sev = f.severity?.toLowerCase() || "info";
    if (counts.hasOwnProperty(sev)) counts[sev as keyof typeof counts]++;
  }

  const riskScore = Math.min(100, Math.max(0,
    counts.critical * 25 +
    counts.high * 12 +
    counts.medium * 5 +
    counts.low * 2
  ));

  let riskLevel = "low";
  if (riskScore >= config.RISK_THRESHOLDS.critical) riskLevel = "critical";
  else if (riskScore >= config.RISK_THRESHOLDS.high) riskLevel = "high";
  else if (riskScore >= config.RISK_THRESHOLDS.medium) riskLevel = "medium";

  const summary = claudeSummary || (
    `Analyzed ${contractName} using ${agentsUsed.length} agents. ` +
    `Found ${uniqueFindings.length} unique issues.`
  );

  const result: AuditResult = {
    risk_level: riskLevel,
    risk_score: riskScore,
    total_findings: uniqueFindings.length,
    raw_findings_count: allFindings.length,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
    info_count: counts.info,
    findings: uniqueFindings,
    summary,
    agents_used: agentsUsed,
    scan_duration_ms: Date.now() - startTime,
    plan_used: plan,
    has_fix_suggestions: uniqueFindings.some((f: any) => f.recommendation),
    deployment_verdict: claudeVerdict || (riskScore >= 50 ? "DO NOT DEPLOY" : "DEPLOY WITH CAUTION"),
    thinking_chain: thinkingChain,
    is_deep_audit: plan === "deep_audit",
    errors: errors.length ? errors : undefined,
  };

  console.log("\n" + "=".repeat(65));
  console.log(`✅ AUDIT COMPLETE | Risk: ${riskLevel.toUpperCase()} (${riskScore}/100) | ${result.scan_duration_ms}ms`);
  console.log(`   ${counts.critical}C | ${counts.high}H | ${counts.medium}M | ${counts.low}L`);
  if (errors.length) {
    console.log(`   ⚠️ ${errors.length} agent(s) had errors but audit completed`);
  }
  console.log("=".repeat(65) + "\n");

  return result;
}