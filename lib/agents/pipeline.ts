import { config, AGENT_CONFIGS } from '../config';
import { runGroqAnalysis } from './groq-agent';
import { runGeminiAnalysis } from './gemini-agent';
import { runClaudeAnalysis } from './claude-agent';
import { deduplicateAndValidate, filterForPDF } from './dedup-engine';

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
  pdf_base64?: string;
}

// C-05: Test file detection - BLOCK test files immediately
const TEST_IMPORTS = [
  "forge-std/Test.sol",
  "hardhat/console.sol", 
  "ds-test/test.sol",
  "forge-std/Script.sol",
  "forge-std/StdInvariant.sol",
  "forge-std/StdStorage.sol",
  "forge-std/console.sol",
  "foundry-test",
  "@nomicfoundation/hardhat",
  "@openzeppelin/test-helpers",
  "truffle/assertions"
];

const TEST_PATTERNS = [
  /function test[A-Z]/,
  /function test[A-Z]\w+\(\)/,
  /function invariant[A-Z]/,
  /function setUp\(\)/,
  /function tearDown\(\)/,
  /describe\(/,
  /it\(/,
  /expect\(/,
  /assert\./,
  /chai\./,
  /expectEmit/,
  /expectRevert/
];

function isTestFile(contractCode: string): { isTest: boolean; reason: string } {
  // Check for test imports
  for (const testImport of TEST_IMPORTS) {
    if (contractCode.includes(testImport)) {
      return { isTest: true, reason: `Contains test import: ${testImport}` };
    }
  }
  
  // Check for test function patterns
  const lines = contractCode.split('\n');
  let testFunctionCount = 0;
  for (const line of lines) {
    for (const pattern of TEST_PATTERNS) {
      if (pattern.test(line)) {
        testFunctionCount++;
        if (testFunctionCount >= 2) {
          return { isTest: true, reason: `Contains test patterns: ${pattern.source}` };
        }
      }
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
  
  console.log("\n" + "=".repeat(65));
  console.log(`🚀 AuditSmart v3.0 | ${contractName} | Plan: ${plan.toUpperCase()}`);
  console.log(`   Contract: ${contractCode.length} chars`);
  console.log("=".repeat(65));

  // C-05: Block test files immediately
  const testCheck = isTestFile(contractCode);
  if (testCheck.isTest) {
    console.log(`❌ BLOCKED: Test file detected - ${testCheck.reason}`);
    throw new Error(`TEST_FILE_DETECTED: Upload a production contract, not a test file. ${testCheck.reason}`);
  }

  let allFindings: any[] = [];
  const agentsUsed: string[] = [];

  // Phase 1: 8 Groq agents
  console.log("\n📡 Phase 1: 8 Groq agents (parallel)...");
  const groqResults = await Promise.all(
    AGENT_CONFIGS.map(async (agent) => {
      const findings = await runGroqAnalysis(contractCode, agent.focus, agent.name);
      if (findings.length) {
        allFindings.push(...findings);
        agentsUsed.push(agent.name);
        console.log(`   ✅ ${agent.name}: ${findings.length} findings`);
      }
      return findings;
    })
  );

  console.log(`\n   Phase 1 total: ${allFindings.length} raw findings`);

  // Phase 2: AI Orchestrator
  let thinkingChain: string | null = null;
  let claudeVerdict = "";
  let claudeSummary = "";

  if (plan === "free") {
    console.log("\n🤖 Phase 2: Gemini Orchestrator (Free plan)...");
    const geminiFindings = await runGeminiAnalysis(contractCode);
    if (geminiFindings.length) {
      allFindings.push(...geminiFindings);
      agentsUsed.push("gemini_agent");
      console.log(`   ✅ gemini_agent: ${geminiFindings.length} findings`);
    }
  } else if (["pro", "enterprise", "deep_audit"].includes(plan)) {
    const labels: Record<string, string> = {
      pro: "Claude Haiku",
      enterprise: "Claude Sonnet",
      deep_audit: "Claude Opus + Extended Thinking 🧠"
    };
    console.log(`\n🤖 Phase 2: ${labels[plan]} (${plan})...`);
    
    const claudeResult = await runClaudeAnalysis(contractCode, allFindings, plan);
    
    if (claudeResult.findings.length) {
      allFindings.push(...claudeResult.findings);
      agentsUsed.push(`claude_${plan}`);
      console.log(`   ✅ claude_${plan}: ${claudeResult.findings.length} additional findings`);
    }
    
    thinkingChain = claudeResult.thinking;
    claudeVerdict = claudeResult.verdict;
    claudeSummary = claudeResult.summary;
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

  const riskScore = Math.min(100, (
    counts.critical * 25 +
    counts.high * 12 +
    counts.medium * 5 +
    counts.low * 2
  ));

  let riskLevel = "info";
  if (riskScore >= config.RISK_THRESHOLDS.critical) riskLevel = "critical";
  else if (riskScore >= config.RISK_THRESHOLDS.high) riskLevel = "high";
  else if (riskScore >= config.RISK_THRESHOLDS.medium) riskLevel = "medium";
  else if (riskScore >= config.RISK_THRESHOLDS.low) riskLevel = "low";

  const summary = claudeSummary || (
    `Analyzed ${contractName} using ${agentsUsed.length} agents. ` +
    `Found ${uniqueFindings.length} unique issues: ` +
    `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`
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
    has_fix_suggestions: uniqueFindings.some((f: any) => f.auto_fix || f.fix_code_snippet),
    deployment_verdict: claudeVerdict,
    thinking_chain: thinkingChain,
    is_deep_audit: plan === "deep_audit",
  };

  console.log("\n" + "=".repeat(65));
  console.log(`✅ AUDIT COMPLETE | Risk: ${riskLevel.toUpperCase()} (${riskScore}/100) | Duration: ${result.scan_duration_ms}ms`);
  console.log(`   ${counts.critical}C | ${counts.high}H | ${counts.medium}M | ${counts.low}L | Fixes: ${result.has_fix_suggestions ? '✅' : '❌'}`);
  console.log("=".repeat(65) + "\n");

  return result;
}