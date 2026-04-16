// lib/agents/claude-agent.ts - Only update the model function
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!anthropicClient && config.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getModelForPlan(plan: string): string {
  switch (plan) {
    case "pro": return config.CLAUDE_HAIKU_MODEL;      // ✅ Fixed
    case "enterprise": return config.CLAUDE_SONNET_MODEL; // ✅ Fixed
    case "deep_audit": return config.CLAUDE_OPUS_MODEL;   // ✅ Fixed
    default: return config.CLAUDE_HAIKU_MODEL;
  }
}

const SYSTEM_PROMPT = `You are the world's most advanced Solidity smart contract security auditor, with expert-level knowledge of EVM internals, DeFi protocol mechanics, and every major vulnerability class. You have studied every major exploit in DeFi history — The DAO ($60M reentrancy), Parity Wallet ($150M access control), Euler Finance ($197M flash loan), Nomad Bridge ($190M lack of input validation), Ronin Network ($625M key compromise), and hundreds more.

CRITICAL RULES:
1. Only report vulnerabilities with DIRECT, CONCRETE evidence in the provided code.
2. Do NOT speculate about features not present in the code shown.
3. Do NOT report generic "might be vulnerable" findings — cite the exact vulnerable line/pattern.
4. Assign severity based on real-world exploitability, not theoretical risk.
5. Every finding must include: exact function name, line reference, attack scenario, and corrected code.

SEVERITY CLASSIFICATION:
  critical → Funds stolen in a single transaction, no preconditions
  high     → Significant fund loss, complete privilege loss, requires ≤2 steps
  medium   → Partial loss, locked funds, requires specific conditions or privileges
  low      → Best-practice violation with negligible direct financial risk
  info     → Gas optimization, style issue, documentation gap only

CONFIDENCE RATING:
  HIGH   → Exact vulnerable code pattern visible, line identified, attack is deterministic
  MEDIUM → Strong indicator present, minor assumption about external state
  LOW    → Theoretical, depends on missing context or external contract behavior

Always use the report_findings tool. Never add prose outside tool calls.`;

function getAuditTool(includeExploit: boolean = false): any {
  const properties: any = {
    type: { type: "string", description: "Vulnerability name" },
    severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
    confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"], description: "Confidence level based on direct evidence" },
    function: { type: "string", description: "Affected function name" },
    line: { type: "string", description: "Line number or range" },
    description: { type: "string", description: "What is wrong and exact exploit path" },
    recommendation: { type: "string", description: "Specific code fix" },
  };

  if (includeExploit) {
    properties.exploit_scenario = {
      type: "string",
      description: "Step-by-step attacker walkthrough"
    };
    properties.fix_code_snippet = {
      type: "string",
      description: "Exact patched code snippet ready to use"
    };
  }

  return {
    name: "report_findings",
    description: "Report all security vulnerabilities found in the smart contract",
    input_schema: {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: { type: "object", properties, required: ["type", "severity", "confidence", "function", "description", "recommendation"] }
        },
        overall_assessment: { type: "string", description: "2-3 sentence executive summary" },
        deployment_recommendation: { type: "string", enum: ["SAFE TO DEPLOY", "DEPLOY WITH CAUTION", "DO NOT DEPLOY"] }
      },
      required: ["findings", "overall_assessment", "deployment_recommendation"]
    }
  };
}

export async function runClaudeAnalysis(
  contractCode: string,
  groqFindings: any[],
  plan: string
): Promise<{ findings: any[]; summary: string; verdict: string; thinking: string | null }> {
  const client = getClient();
  if (!client) {
    console.log("⚠️ Claude API key missing");
    return { findings: [], summary: "", verdict: "", thinking: null };
  }

  const includeExploit = plan === "enterprise" || plan === "deep_audit";
  const isDeepAudit = plan === "deep_audit";

  const findingsSummary = formatFindingsForPrompt(groqFindings);

  const userPrompt = isDeepAudit
    ? `════════════════════════════════════════════════════════════════
DEEP AUDIT — PAID PREMIUM ANALYSIS — Maximum Thoroughness Required
════════════════════════════════════════════════════════════════

This is a premium deep audit. The user has paid for the most thorough analysis possible. Miss nothing.

PRELIMINARY FINDINGS FROM SPECIALIST AGENTS (validate + expand these):
${findingsSummary}

FULL CONTRACT SOURCE:
\`\`\`solidity
${contractCode}
\`\`\`

════════════════════════════════════════════════════════════════
YOUR MANDATE — think step by step through each of these:

1. VALIDATE AGENT FINDINGS
   - Confirm each agent finding with direct code evidence
   - Escalate or downgrade severity if warranted
   - Discard any finding that lacks evidence in the code above

2. DEEP VULNERABILITY SWEEP — check each category:

   ACCESS CONTROL
   □ Every privileged function (mint, burn, withdraw, upgrade, setFee, pause, initialize) has a guard?
   □ Can initializer be called twice?
   □ Can ownership be set to address(0)?
   □ Is two-step ownership transfer enforced?

   REENTRANCY
   □ Every external call (ETH send, ERC20 transfer, .call()) happens AFTER state updates?
   □ Cross-function reentrancy: can attacker reenter a different function mid-call?
   □ Read-only reentrancy: does a view function read state exploitable mid-call?

   ARITHMETIC
   □ Solidity version and SafeMath usage aligned?
   □ Every subtraction checked for underflow before execution?
   □ Multiplication done before division to prevent precision loss?
   □ unchecked{} blocks — is each one provably safe?

   FLASH LOAN / ORACLE
   □ Any spot price reads from AMM (manipulable in one tx)?
   □ Chainlink staleness check present (updatedAt + heartbeat)?
   □ First-depositor share inflation attack possible?

   DANGEROUS OPERATIONS
   □ selfdestruct — who can call it?
   □ delegatecall — is the target address user-controlled?
   □ tx.origin used for auth?
   □ block.timestamp / blockhash used for randomness?

   TOKEN LOGIC
   □ ERC20 return values checked?
   □ Fee-on-transfer token compatibility?
   □ Approval race condition exploitable?

   BUSINESS LOGIC
   □ Can functions be called in wrong order?
   □ Can user withdraw more than deposited?
   □ Rounding errors across multiple calls?
   □ Missing zero-address guards on setters?

3. COMPOSE EXECUTIVE SUMMARY
   - 3-5 sentence overall assessment
   - Risk level justification
   - Deployment recommendation with specific conditions

Use the report_findings tool with all validated + newly discovered findings.`
    : `════════════════════════════════════════════════════════════════
SMART CONTRACT SECURITY REVIEW
════════════════════════════════════════════════════════════════

FINDINGS FROM SPECIALIST AGENTS (validate, expand, fill gaps):
${findingsSummary}

CONTRACT:
\`\`\`solidity
${contractCode.slice(0, 8000)}
\`\`\`

════════════════════════════════════════════════════════════════
YOUR TASKS:

1. VALIDATE AGENT FINDINGS
   Confirm each finding has direct code evidence. Remove or downgrade speculative findings.
   Escalate severity if the agent underestimated an exploitable bug.

2. FIND MISSED CRITICAL/HIGH ISSUES
   The specialist agents focus on narrow areas. Look for issues they may have missed:
   - Business logic flaws unique to this contract's purpose
   - Interaction bugs between functions (e.g. state set by function A breaks function B)
   - Missing zero-address checks on parameters that affect fund routing
   - Incorrect event ordering or state machine transitions
   - Privilege escalation through indirect paths

3. ASSESS EACH FINDING
   - Assign HIGH confidence only if: exact vulnerable line visible, attack is deterministic
   - Assign MEDIUM if: strong indicator but depends on caller behaviour
   - Assign LOW if: theoretical/requires external context — THESE WILL BE FILTERED FROM REPORTS

4. WRITE CLEAR DESCRIPTIONS
   Each description must include:
   - What the vulnerable code pattern is (cite the function/line)
   - Step-by-step attacker action (what they call, in what order, what happens)
   - What the attacker gains or what breaks
   - The corrected code with explanation

Use the report_findings tool now.`;

  try {
    console.log(`🤖 Claude ${plan}: sending request...`);

    const messageParams: any = {
      model: getModelForPlan(plan),
      max_tokens: isDeepAudit ? 16000 : (plan === "enterprise" ? 6000 : 3000),
      system: SYSTEM_PROMPT,
      tools: [getAuditTool(includeExploit)],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: userPrompt }]
    };

    if (isDeepAudit) {
      messageParams.thinking = {
        type: "enabled",
        budget_tokens: 8000
      };
    }

    const response = await Promise.race([
      client.messages.create(messageParams),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), config.CLAUDE_TIMEOUT_SECONDS * 1000)
      )
    ]) as any;

    return extractToolResult(response, plan, isDeepAudit);
  } catch (error) {
    console.error(`❌ Claude ${plan} error:`, error);
    return { findings: [], summary: "", verdict: "", thinking: null };
  }
}

function formatFindingsForPrompt(findings: any[], limit: number = 25): string {
  if (!findings.length) return "No findings from specialist agents yet.";
  
  const lines = findings.slice(0, limit).map((f, i) => 
    `${i + 1}. [${f.severity?.toUpperCase()}] ${f.type || 'Unknown'} in ${f.function || '?'} — ${f.description?.slice(0, 150)}`
  );
  
  if (findings.length > limit) {
    lines.push(`... and ${findings.length - limit} more findings`);
  }
  
  return lines.join("\n");
}

function extractToolResult(response: any, plan: string, isDeepAudit: boolean): any {
  let findings: any[] = [];
  let summary = "";
  let verdict = "";
  let thinkingBlocks: string[] = [];

  for (const block of response.content) {
    if (block.type === "thinking") {
      thinkingBlocks.push(block.thinking);
    }
    
    if (block.type === "tool_use" && block.name === "report_findings") {
      const input = block.input;
      summary = input.overall_assessment || "";
      verdict = input.deployment_recommendation || "";
      
      findings = (input.findings || []).map((f: any) => ({
        ...f,
        source: `claude_${plan}`,
        ai_enhanced: true,
        severity: f.severity?.toLowerCase(),
        confidence: f.confidence || "MEDIUM"
      }));
    }
  }

  console.log(`✅ Claude (${plan}): ${findings.length} findings | verdict: ${verdict || "N/A"}`);
  
  return {
    findings,
    summary,
    verdict,
    thinking: isDeepAudit && thinkingBlocks.length ? thinkingBlocks.join("\n---\n") : null
  };
}