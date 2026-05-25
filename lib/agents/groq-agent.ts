// lib/agents/groq-agent.ts
import Groq from "groq-sdk";
import { config } from "../config";
import {
  languageDisplayName,
  languageFence,
  type ContractLanguage,
} from "../contract-language";

export interface GroqFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  function: string;
  line: string;
  description: string;
  recommendation: string;
  confidence: string;
  source: string;
}

let _client: Groq | null = null;

function getClient(): Groq | null {
  if (!_client && config.GROQ_API_KEY) {
    // maxRetries: 1 → worst-case per agent = 2 × 30s = 60s.
    // maxRetries: 2 was causing occasional 90s agent runs, pushing
    // the overall pipeline past the 2-minute polling window.
    _client = new Groq({ apiKey: config.GROQ_API_KEY, maxRetries: 1 });
  }
  return _client;
}

function buildSystemPrompt(language: ContractLanguage): string {
  const langName = languageDisplayName(language);

  // Language-specific exemplar exploits keep the auditor anchored in real
  // attacks for the right ecosystem.
  const exploitLore: Record<ContractLanguage, string> = {
    solidity:           "Reentrancy (The DAO), Flash Loan attacks (PancakeBunny, Euler), Integer Overflows (BEC token), Access Control failures (Parity Wallet)",
    vyper:              "Reentrancy via raw_call, init-order issues, the Curve Vyper compiler reentrancy lock bug (Jul 2023, $70M+)",
    rust:               "Solana CPI confusion (Wormhole $325M), missing signer checks on Anchor instructions, PDA collisions, close-account re-init attacks",
    func:               "TON Jetton sender-spoofing on recv_internal, missing bounce-handling causing permanent fund loss, op-code collisions across standards",
    tact:               "Tact/FunC compilation pitfalls, missing self.requireOwner() in receive() handlers, message-value vs storage-rent miscalculation",
    ink:                "ink! transfer_acceptor reentrancy, set_code_hash storage-layout corruption, Substrate runtime upgrade pitfalls",
    cosmwasm:           "CosmWasm reply-handler reentrancy (Astroport reorg bug), missing reply_on filter, sudo/migrate authorization gaps, IBC packet replay across channels",
    "json-inscription": "BRC-20 tick squatting/homograph attacks, malformed runestone causing cenotaph burns, ordinal HTML payloads executing wallet-draining JS in marketplaces, inscribed private keys",
    move:               "Aptos/Sui resource-safety violations, public(friend) abuse, capability leaks via global storage",
    cairo:              "StarkNet account abstraction signature replay, missing felt-range checks, storage-var collision across class-hash upgrades",
    clarity:            "Stacks post-condition bypass, trait substitution attacks, principal-vs-contract caller confusion",
    unknown:            "common smart-contract exploit classes across EVM, Solana, TON, Cosmos, and Bitcoin ecosystems",
  };

  return `You are an elite ${langName} smart contract security auditor. You have deep expertise in this platform's internals, exploit mechanics, and adversarial analysis. You have reviewed hundreds of contracts that have been exploited in the wild — ${exploitLore[language] ?? exploitLore.unknown}. You know exactly what real exploits look like in code.

ABSOLUTE RULES:
1. Only report vulnerabilities with DIRECT, CONCRETE evidence in the provided contract code.
2. Do NOT speculate about code that is not shown. Do NOT report "possible" issues without evidence.
3. Assign severity based on real exploitability — can funds actually be stolen?
4. Return ONLY a valid JSON array. No markdown, no prose, no explanations outside the JSON.
5. Return [] if the contract has no issues matching the audit focus.`;
}

function buildPrompt(contractCode: string, focus: string, language: ContractLanguage): string {
  const langName = languageDisplayName(language);
  const fence = languageFence(language);

  return `════════════════════════════════════════════════════════════
${langName.toUpperCase()} SECURITY AUDIT — SPECIALIST FOCUS: ${focus}
════════════════════════════════════════════════════════════

CONTRACT UNDER REVIEW:
\`\`\`${fence}
${contractCode.slice(0, 12000)}
\`\`\`

════════════════════════════════════════════════════════════
AUDIT METHODOLOGY — follow all steps before responding:

STEP 1 — UNDERSTAND THE CONTRACT
- Identify all state variables and their types/visibility
- List all external-facing functions (public/external)
- Note all modifiers and their logic
- Identify all places where ETH/tokens move

STEP 2 — APPLY THE CHECKLIST FOR YOUR FOCUS AREA
Trace every possible attack path relevant to: ${focus}

STEP 3 — SEVERITY CLASSIFICATION
Assign severity ONLY based on real-world exploitability:
  CRITICAL = funds can be stolen in a SINGLE transaction with no preconditions
  HIGH     = significant fund loss or privilege escalation requiring ≤2 transactions
  MEDIUM   = limited loss, requires specific conditions or multiple steps
  LOW      = best-practice violation, negligible direct risk
  INFO     = style, documentation, gas optimization (no security risk)

STEP 4 — EVIDENCE REQUIREMENT
For each finding, cite:
  - The exact function name where the issue occurs
  - The approximate line number(s)
  - The exact code pattern that is vulnerable
  - A concrete attack scenario (who does what, what is stolen/broken)
  - The specific code fix (with corrected code snippet where possible)

════════════════════════════════════════════════════════════
REQUIRED OUTPUT FORMAT — JSON array only:

[
  {
    "type": "<specific vulnerability class — e.g. Reentrancy in withdraw(), Not just 'Reentrancy'>",
    "severity": "<critical|high|medium|low|info>",
    "function": "<exact function name where the bug exists>",
    "line": "<line number or range, e.g. '47' or '42-55'>",
    "description": "<Comprehensive description: what the vulnerable pattern is, why it is exploitable, what an attacker does step-by-step, what they gain or what breaks. Minimum 2 sentences.>",
    "recommendation": "<Specific actionable fix. Include the corrected code snippet. Explain WHY the fix works.>"
  }
]

Return [] if this contract has NO exploitable issues in the focus area above.`;
}

function isValidFinding(f: unknown): f is GroqFinding {
  if (typeof f !== "object" || f === null) return false;
  const obj = f as Record<string, unknown>;
  return typeof obj.type === "string" && typeof obj.severity === "string";
}

function parseResponse(raw: string): GroqFinding[] {
  const text = raw.trim();

  // Strategy 1: direct JSON parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.filter(isValidFinding);
    if (Array.isArray((parsed as any).findings))
      return (parsed as any).findings.filter(isValidFinding);
  } catch {
    // fall through
  }

  // Strategy 2: extract first [...] block (handles leading/trailing prose)
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed.filter(isValidFinding);
    } catch {
      // fall through
    }
  }

  return [];
}

export async function runGroqAnalysis(
  contractCode: string,
  focus: string,
  agentName: string,
  language: ContractLanguage = "solidity"
): Promise<GroqFinding[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const completionPromise = client.chat.completions.create({
      model: config.GROQ_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(language) },
        { role: "user",   content: buildPrompt(contractCode, focus, language) },
      ],
      max_tokens: config.GROQ_MAX_TOKENS,
      temperature: 0.05,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout")),
        config.AGENT_TIMEOUT_SECONDS * 1000
      )
    );

    const response = await Promise.race([completionPromise, timeoutPromise]);
    const content = response.choices[0]?.message?.content ?? "";

    const findings = parseResponse(content).map((f) => ({
      ...f,
      source:     agentName,
      confidence: f.confidence ?? "HIGH",
    }));

    console.log(`[groq:${agentName}] ${findings.length} finding(s)`);
    return findings;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[groq:${agentName}] ${msg}`);
    return [];
  }
}
