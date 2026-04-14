import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!genAI && config.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return genAI;
}

const PROMPT = `You are a world-class smart contract security auditor.

CRITICAL RULE: Only report vulnerabilities with DIRECT evidence in the code. Do NOT speculate.

Analyze this Solidity contract for ALL vulnerability types:

1. REENTRANCY: Check every function with external calls
2. ACCESS CONTROL: Does every function have proper checks?
3. INTEGER MATH: Can overflow/underflow occur?
4. SELFDESTRUCT/DELEGATECALL BACKDOORS: CRITICAL if found
5. SIGNATURE VERIFICATION: Is replay protection used?
6. ORACLE MANIPULATION: Are price bounds enforced?
7. FLASH LOAN: Can the flash loan repayment be bypassed?
8. GOVERNANCE: Is quorum required? Can proposals execute arbitrary calls?
9. DOS: Are there unbounded loops?
10. INITIALIZATION: Can initialize() be called multiple times?

Return ONLY a JSON array. Each finding:
{
  "type": "Vulnerability Name",
  "severity": "critical|high|medium|low|info",
  "confidence": "HIGH|MEDIUM|LOW",
  "line": "line number",
  "function": "function_name",
  "description": "Detailed explanation with exploit path",
  "recommendation": "Specific code fix"
}

Contract to audit:
\`\`\`solidity
CONTRACT_CODE
\`\`\``;

export async function runGeminiAnalysis(contractCode: string): Promise<any[]> {
  const client = getClient();
  if (!client) {
    console.log("⚠️ Gemini API key missing");
    return [];
  }

  try {
    const model = client.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: config.GEMINI_MAX_TOKENS,
        responseMimeType: "application/json",
      },
    });

    const prompt = PROMPT.replace("CONTRACT_CODE", contractCode.slice(0, 15000));
    console.log("🔍 Gemini agent: sending request...");

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), config.AGENT_TIMEOUT_SECONDS * 1000)
      )
    ]) as any;

    const response = await result.response;
    const content = response.text();
    console.log(`🔍 Gemini agent: got response (${content.length} chars)`);

    return parseGeminiFindings(content);
  } catch (error) {
    console.error("❌ Gemini agent error:", error);
    return [];
  }
}

function parseGeminiFindings(content: string): any[] {
  try {
    let parsed = JSON.parse(content);
    let findings: any[] = [];

    if (Array.isArray(parsed)) {
      findings = parsed;
    } else if (parsed.findings && Array.isArray(parsed.findings)) {
      findings = parsed.findings;
    }

    const validated = findings.filter(f => f.type && f.severity).map(f => ({
      ...f,
      severity: normalizeSeverity(f.severity),
      confidence: f.confidence || "MEDIUM",
      line: String(f.line || ""),
      source: "gemini_agent"
    }));

    console.log(`✅ Gemini agent: found ${validated.length} findings`);
    return validated;
  } catch {
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