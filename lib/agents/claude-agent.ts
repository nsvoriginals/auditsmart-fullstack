// lib/agents/claude-agent.ts
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
    case "pro": return config.CLAUDE_HAIKU_MODEL;
    case "enterprise": return config.CLAUDE_SONNET_MODEL;
    case "deep_audit": return config.CLAUDE_OPUS_MODEL;
    default: return config.CLAUDE_HAIKU_MODEL;
  }
}

const SYSTEM_PROMPT = `You are the world's most advanced Solidity smart contract security auditor.

SEVERITY GUIDE:
- critical → Direct fund theft, total compromise
- high → Significant fund loss, privilege escalation
- medium → Limited fund risk, logic errors
- low → Best practices, gas optimizations
- info → Documentation, style, informational

Always use the provided tool. Never add prose outside tool calls.`;

function getAuditTool(includeExploit: boolean = false): any {
  const properties: any = {
    type: { type: "string", description: "Vulnerability name" },
    severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
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
          items: { type: "object", properties, required: ["type", "severity", "function", "description", "recommendation"] }
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
    ? `DEEP SECURITY AUDIT — Maximum thoroughness required.

This is a paid premium audit. Find EVERY possible vulnerability.

FINDINGS FROM SPECIALIST AGENTS:
${findingsSummary}

CONTRACT:
\`\`\`solidity
${contractCode}
\`\`\`

Think deeply before using report_findings tool.`
    : `Review this Solidity contract security audit.

FINDINGS FROM SPECIALIST AGENTS:
${findingsSummary}

YOUR TASK:
1. Find any critical/high issues the agents missed
2. Validate existing findings

CONTRACT:
\`\`\`solidity
${contractCode.slice(0, 8000)}
\`\`\`

Use report_findings tool.`;

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
        severity: f.severity?.toLowerCase()
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
