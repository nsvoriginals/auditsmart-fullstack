// lib/agents/groq-agent.ts
import Groq from 'groq-sdk';
import { config } from '../config';

let groqClient: Groq | null = null;

function getClient(): Groq | null {
  if (!groqClient && config.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are an expert Solidity smart contract security auditor with 10+ years experience.

CRITICAL RULES:
1. Only report vulnerabilities that ACTUALLY EXIST in the code.
2. Each finding MUST reference a specific function name.
3. Do NOT duplicate findings.
4. Severity must be accurate: critical (fund theft), high (significant loss), medium (limited risk), low (best practices), info (style).

Respond ONLY with a valid JSON array. Each finding:
{
  "type": "Vulnerability Name",
  "severity": "critical|high|medium|low|info",
  "line": "line number or range",
  "function": "function_name",
  "description": "Detailed explanation with exact exploit path",
  "recommendation": "Specific code fix"
}`;

export async function runGroqAnalysis(
  contractCode: string,
  focus: string,
  agentName: string
): Promise<any[]> {
  const client = getClient();
  if (!client) {
    console.log(`⚠️ Groq API key missing — skipping ${agentName}`);
    return [];
  }

  try {
    const prompt = `Audit this Solidity contract. Focus SPECIFICALLY on: ${focus}

Solidity contract:
\`\`\`solidity
${contractCode.slice(0, 10000)}
\`\`\`

Return ONLY a JSON array of findings. Be precise and specific.`;

    console.log(`🔍 Groq ${agentName}: sending request...`);

    const response = await Promise.race([
      client.chat.completions.create({
        model: config.GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: config.GROQ_MAX_TOKENS,
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), config.AGENT_TIMEOUT_SECONDS * 1000)
      )
    ]) as any;

    const content = response.choices[0].message.content;
    console.log(`🔍 Groq ${agentName}: got response (${content.length} chars)`);

    return parseFindings(content, agentName);
  } catch (error) {
    console.error(`❌ Groq ${agentName} error:`, error);
    return [];
  }
}

function parseFindings(content: string, agentName: string): any[] {
  try {
    let parsed = JSON.parse(content);
    
    // Handle different response formats
    let findings: any[] = [];
    if (Array.isArray(parsed)) {
      findings = parsed;
    } else if (parsed.findings && Array.isArray(parsed.findings)) {
      findings = parsed.findings;
    } else if (parsed.vulnerabilities && Array.isArray(parsed.vulnerabilities)) {
      findings = parsed.vulnerabilities;
    }

    // Validate and normalize findings
    const validated = findings.filter(f => f.type && f.severity).map(f => ({
      ...f,
      severity: normalizeSeverity(f.severity),
      line: String(f.line || ""),
      source: agentName
    }));

    console.log(`✅ Groq ${agentName}: found ${validated.length} findings`);
    return validated;
  } catch {
    // Try to extract JSON array from text
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return [];
      }
    }
    return [];
  }
}

function normalizeSeverity(severity: string): string {
  const sev = severity.toLowerCase();
  if (["critical", "high", "medium", "low", "info"].includes(sev)) {
    return sev;
  }
  return "info";
}