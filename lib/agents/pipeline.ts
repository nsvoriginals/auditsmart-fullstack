// lib/agents/pipeline.ts - multi-chain audit dispatcher
import { config, AGENT_CONFIGS } from '../config';
import { runGroqAnalysis } from './groq-agent';
import { runGeminiAnalysis } from './gemini-agent';
import { runClaudeAnalysis } from './claude-agent';
import { deduplicateAndValidate } from './dedup-engine';
import { getChain } from '../chains';
import { getStandard } from '../standards';
import { detectLanguage, type ContractLanguage } from '../contract-language';

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
  errors?: string[];
  chain?: string;
  language?: ContractLanguage;
}

// C-05: Solidity test-file detection. Non-Solidity inputs are skipped.
const TEST_IMPORTS = [
  "forge-std/Test.sol",
  "hardhat/console.sol",
  "ds-test/test.sol",
  "forge-std/Script.sol",
];

function isTestFile(contractCode: string, language: ContractLanguage): { isTest: boolean; reason: string } {
  if (language !== "solidity") return { isTest: false, reason: "" };
  for (const testImport of TEST_IMPORTS) {
    if (contractCode.includes(testImport)) {
      return { isTest: true, reason: `Contains test import: ${testImport}` };
    }
  }
  return { isTest: false, reason: "" };
}

// Map DB plan names (PREMIUM, ADMIN) to pipeline plan names (pro, enterprise).
function normalizePlan(raw: string): string {
  switch (raw.toLowerCase()) {
    case "premium": return "pro";
    case "admin":   return "enterprise";
    default:        return raw.toLowerCase();
  }
}

export async function runAuditPipeline(
  contractCode: string,
  contractName: string = "Contract",
  plan: string = "free",
  standardIds: string[] = [],
  chainId: string = "ethereum"
): Promise<AuditResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  plan = normalizePlan(plan);

  const chain = getChain(chainId);
  const language = detectLanguage(chainId, contractCode);

  console.log("\n" + "=".repeat(65));
  console.log(`🚀 AuditSmart v3.1 | ${contractName} | Plan: ${plan.toUpperCase()}`);
  console.log(`   Chain: ${chain?.label ?? chainId} | Language: ${language}`);
  console.log(`   Contract: ${contractCode.length} chars`);
  if (standardIds.length) console.log(`   Standards: ${standardIds.join(", ")}`);
  console.log("=".repeat(65));

  // C-05: Block Solidity test files (only applies to Solidity input)
  const testCheck = isTestFile(contractCode, language);
  if (testCheck.isTest) {
    console.log(`❌ BLOCKED: Test file detected - ${testCheck.reason}`);
    throw new Error(`TEST_FILE_DETECTED: ${testCheck.reason}`);
  }

  let allFindings: any[] = [];
  const agentsUsed: string[] = [];

  // ── Agent selection ────────────────────────────────────────────────────
  //
  // Base AGENT_CONFIGS (reentrancy, overflow, access, logic, gas_dos, defi,
  // backdoor, signature) are written for Solidity/EVM semantics. They apply
  // to EVM chains AND TRON (TVM is Solidity-flavored). For all other chains
  // we run only the standard-specific specialists from STANDARDS.
  const baseAgentsApply = language === "solidity";

  // Pull standard-specific agents from STANDARDS for every selected standard.
  const standardAgents = standardIds
    .map(id => getStandard(id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map(s => ({ name: s.agentName, focus: s.focus }));

  const activeAgents: { name: string; focus: string }[] = [
    ...(baseAgentsApply ? AGENT_CONFIGS : []),
    ...standardAgents,
  ];

  if (activeAgents.length === 0) {
    // Non-EVM chain with no standard selected — fall back to a generic
    // language-aware audit via the orchestrator only.
    console.log(`   ⚠️ No specialist agents matched chain=${chainId}, standards=[${standardIds.join(",")}]. Orchestrator only.`);
  }

  console.log(`\n📡 Phase 1: ${activeAgents.length} Groq agents (parallel)...`);
  if (standardAgents.length) {
    console.log(`   Specialists: ${standardAgents.map(a => a.name).join(", ")}`);
  }

  const groqResults = await Promise.allSettled(
    activeAgents.map(async (agent) => {
      try {
        const findings = await runGroqAnalysis(contractCode, agent.focus, agent.name, language);
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

  const successfulAgents = groqResults.filter(r => r.status === 'fulfilled').length;
  console.log(`\n   Phase 1: ${successfulAgents}/${activeAgents.length} agents succeeded, ${allFindings.length} raw findings`);

  // ── Phase 2: Orchestrator ──────────────────────────────────────────────
  let thinkingChain: string | null = null;
  let claudeVerdict = "";
  let claudeSummary = "";

  if (plan === "free") {
    console.log("\n🤖 Phase 2: Gemini Orchestrator...");
    let geminiOk = false;
    try {
      const geminiFindings = await runGeminiAnalysis(contractCode, language);
      // Gemini's try/catch swallows errors and returns []. That's
      // indistinguishable from a clean audit unless we also check if the
      // contract was big enough that a real LLM would have produced something.
      // For now: if Gemini returns 0 findings AND we have an Anthropic key,
      // fall back to Claude Haiku so the audit isn't silently empty.
      if (geminiFindings.length) {
        allFindings.push(...geminiFindings);
        agentsUsed.push("gemini_agent");
        console.log(`   ✅ gemini_agent: ${geminiFindings.length} findings`);
        geminiOk = true;
      } else {
        console.log(`   ⚠️ Gemini returned 0 findings — likely rate-limited or quota-exhausted`);
      }
    } catch (error: any) {
      errors.push(`gemini_agent: ${error?.message || 'Unknown error'}`);
      console.log(`   ⚠️ Gemini failed: ${error?.message || 'unknown'}`);
    }

    // Free-plan fallback: if Gemini didn't contribute and we have an Anthropic
    // key, run Claude Haiku as a backup orchestrator. Otherwise the audit
    // produces zero findings whenever Gemini's free tier is exhausted.
    if (!geminiOk && config.ANTHROPIC_API_KEY) {
      console.log("\n🤖 Phase 2b: Claude Haiku fallback...");
      try {
        const claudeResult = await runClaudeAnalysis(contractCode, allFindings, "pro", language);
        if (claudeResult.findings.length) {
          allFindings.push(...claudeResult.findings);
          agentsUsed.push("claude_haiku_fallback");
          console.log(`   ✅ claude_haiku_fallback: ${claudeResult.findings.length} findings`);
        }
        if (claudeResult.summary) claudeSummary = claudeResult.summary;
        if (claudeResult.verdict) claudeVerdict = claudeResult.verdict;
      } catch (error: any) {
        errors.push(`claude_haiku_fallback: ${error?.message || 'Unknown error'}`);
        console.log(`   ⚠️ Claude fallback also failed`);
      }
    }
  } else if (["pro", "enterprise", "deep_audit"].includes(plan)) {
    const labels: Record<string, string> = {
      pro: "Claude Haiku",
      enterprise: "Claude Sonnet",
      deep_audit: "Claude Opus"
    };
    console.log(`\n🤖 Phase 2: ${labels[plan]}...`);

    try {
      const claudeResult = await runClaudeAnalysis(contractCode, allFindings, plan, language);

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
    `Analyzed ${contractName} (${chain?.label ?? chainId} / ${language}) using ${agentsUsed.length} agents. ` +
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
    chain: chain?.id ?? chainId,
    language,
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
