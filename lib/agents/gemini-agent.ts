// lib/agents/gemini-agent.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

export interface GeminiFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  function: string;
  line: number | string;
  description: string;
  recommendation: string;
  source: string;
  confidence: string;
}

let _genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!_genAI && config.GEMINI_API_KEY) {
    _genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return _genAI;
}

function buildPrompt(contractCode: string): string {
  return `You are an elite Solidity smart contract security auditor. You have deep expertise in EVM internals, DeFi exploit mechanics, and every major smart contract vulnerability class. You have studied all major real-world exploits: The DAO reentrancy ($60M), Parity Wallet access control ($150M), Poly Network privilege escalation ($611M), Euler Finance flash loan ($197M), and dozens more.

Your task is to perform a COMPREHENSIVE security audit of the smart contract below and identify every real, exploitable vulnerability.

════════════════════════════════════════════════════════════════════════
CONTRACT TO AUDIT:
\`\`\`solidity
${contractCode.slice(0, 8000)}
\`\`\`
════════════════════════════════════════════════════════════════════════

AUDIT CHECKLIST — examine EVERY category below:

━━━ CATEGORY 1: ACCESS CONTROL (Most Common Critical Bugs) ━━━
□ Can anyone call mint(), burn(), setOwner(), transferOwnership(), setFee(), pause()?
□ Are all administrative functions protected by onlyOwner, onlyRole, or equivalent?
□ Are role checks done BEFORE state changes?
□ Can the initializer be called more than once (re-initialization attack)?
□ Can ownership be transferred to address(0) accidentally?
□ Are two-step ownership transfers enforced for critical roles?

━━━ CATEGORY 2: REENTRANCY ━━━
□ Does any function make an external call (.call, .transfer, .send, token.transfer, IERC20.transfer) BEFORE updating state?
□ Can an attacker reenter the function during an external call and drain funds?
□ Is a reentrancy guard (ReentrancyGuard, mutex) missing from withdraw/swap/claim functions?
□ Are cross-function reentrancy paths possible (e.g. reenter a different function)?
□ Read-only reentrancy: does a view function use state that can be manipulated mid-call?

━━━ CATEGORY 3: INTEGER ARITHMETIC ━━━
□ For Solidity <0.8: is SafeMath used for all arithmetic? Can any value wrap around?
□ For Solidity ≥0.8 with unchecked{}: is each unchecked block truly safe?
□ Can any subtraction underflow (e.g. balances[user] -= amount without prior check)?
□ Division before multiplication causing precision loss (e.g. a/b*c instead of a*c/b)?
□ Can multiplication overflow before reaching uint256 max?
□ Off-by-one errors in loop bounds or index calculations?

━━━ CATEGORY 4: FLASH LOAN / ORACLE MANIPULATION ━━━
□ Does the contract read price or balances from a DEX pool in a single transaction?
□ Can an attacker use a flash loan to temporarily skew the price oracle?
□ Is spot price from AMM used (manipulable) instead of TWAP?
□ Can the token balance of the contract be inflated with a direct transfer before a price check?
□ Are there checks on the source/freshness of price data (Chainlink staleness check)?

━━━ CATEGORY 5: DENIAL OF SERVICE ━━━
□ Are there unbounded loops (for/while) over arrays that could exceed block gas limit?
□ Can a single malicious actor make a function permanently fail (push-payment griefing)?
□ Can external calls in loops cause a single failure to revert the entire transaction?
□ Can a user lock the contract by sending ETH to a payable function or self-destruct?

━━━ CATEGORY 6: SIGNATURE & CRYPTOGRAPHY ━━━
□ Does ecrecover return address(0) for invalid signatures, and is this checked?
□ Are signatures protected against replay attacks (nonce + chainId)?
□ Are signed messages domain-separated (EIP-712)?
□ Can a signature be reused across different contracts or chains?
□ Are hashes computed with all necessary parameters to prevent substitution?

━━━ CATEGORY 7: DANGEROUS OPERATIONS ━━━
□ Is selfdestruct present? Who can call it? Can it be called by anyone?
□ Is delegatecall used with a user-controlled address?
□ Are there proxy patterns with unprotected upgrade functions?
□ Is tx.origin used for authentication instead of msg.sender?
□ Is block.timestamp used as a critical randomness source or deadline?
□ Is blockhash used for randomness (manipulable by miners)?

━━━ CATEGORY 8: TOKEN & DeFi LOGIC ━━━
□ ERC20: are return values from transfer()/transferFrom() checked?
□ ERC20: is the contract compatible with fee-on-transfer tokens?
□ ERC20: is the contract vulnerable to the approval race condition?
□ Are correct slippage checks present on swaps?
□ Can liquidity be removed in the same transaction it is added?
□ Are vault share calculations correct (first-depositor inflation attack)?

━━━ CATEGORY 9: BUSINESS LOGIC ━━━
□ Are there missing state machine transitions?
□ Can functions be called in wrong order (incorrect ordering assumption)?
□ Can an attacker exploit rounding errors across multiple small transactions?
□ Can a user withdraw more than they deposited?
□ Are there missing zero-address checks on critical parameters?
□ Can fee calculations overflow or be set to 100%?

━━━ CATEGORY 10: FRONT-RUNNING ━━━
□ Are there swap functions without slippage protection?
□ Can an attacker see a pending transaction and sandwich it?
□ Are commit-reveal schemes needed but missing?

════════════════════════════════════════════════════════════════════════
SEVERITY CLASSIFICATION:
  CRITICAL = Funds can be stolen in one transaction, no preconditions required
  HIGH     = Significant fund loss or complete privilege escalation, few steps
  MEDIUM   = Partial loss, locked funds, or requires specific conditions
  LOW      = Best-practice violations with minimal direct risk
  INFO     = Gas optimizations, style issues, documentation gaps

EVIDENCE REQUIREMENTS:
- Only report issues with DIRECT EVIDENCE in the code shown above
- For each finding, explain: what the vulnerable code is, how it is exploited, what is the impact, and the exact fix
- Write descriptions that are at least 2–3 sentences: code pattern + attack path + impact

════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT — return this JSON object exactly:

{
  "findings": [
    {
      "type": "<specific name — e.g. 'Reentrancy in withdraw()', not just 'Reentrancy'>",
      "severity": "<critical|high|medium|low|info>",
      "function": "<exact affected function name>",
      "line": <line number as integer, or 0 if uncertain>,
      "description": "<Comprehensive: what the vulnerable pattern is, step-by-step attack scenario, what the attacker gains, what fails or is stolen. Minimum 2-3 sentences.>",
      "recommendation": "<Exact fix with corrected code snippet. Explain why the fix prevents the attack.>"
    }
  ]
}

If the contract has NO vulnerabilities, return: { "findings": [] }`;
}

function isValidFinding(f: unknown): f is GeminiFinding {
  if (typeof f !== "object" || f === null) return false;
  const obj = f as Record<string, unknown>;
  return typeof obj.type === "string" && typeof obj.severity === "string";
}

function parseResponse(raw: string): GeminiFinding[] {
  const text = raw.trim();

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.findings))
      return parsed.findings.filter(isValidFinding);
    if (Array.isArray(parsed))
      return parsed.filter(isValidFinding);
  } catch {
    // fall through to extraction strategy
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed.filter(isValidFinding);
    } catch {
      // nothing recoverable
    }
  }

  return [];
}

export async function runGeminiAnalysis(
  contractCode: string
): Promise<GeminiFinding[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const model = client.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: config.GEMINI_MAX_TOKENS,
        responseMimeType: "application/json",
      },
    });

    const generatePromise = model.generateContent(buildPrompt(contractCode));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout")),
        config.AGENT_TIMEOUT_SECONDS * 1000
      )
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const content = result.response.text();

    const findings = parseResponse(content).map((f) => ({
      ...f,
      source:     "gemini_agent",
      confidence: "HIGH",
      severity:   (f.severity?.toLowerCase() ?? "info") as GeminiFinding["severity"],
    }));

    console.log(`[gemini] ${findings.length} finding(s)`);
    return findings;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[gemini] ${msg}`);
    return [];
  }
}
