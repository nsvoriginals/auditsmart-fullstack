// services/worker/src/services/agent-orchestrator.ts
//
// Top-tier multi-model agentic analysis pipeline.
// Three model families, each used for what it is actually good at:
//
//   Groq  (LLaMA 3.3 70B, 128k context):
//     - 8 parallel specialist agents (< 5s each)
//     - Fast signal alongside deterministic tools
//     - Pattern recognition, structured vulnerability detection
//
//   Gemini (2.0 Flash, 1M context):
//     - 2 specialist agents: gas optimization + ERC compliance
//     - Large-contract analysis where context window matters
//
//   Claude  (Sonnet/Opus/Haiku via plan tier):
//     - AI enhancement layer ONLY — runs after deterministic pass
//     - Narrative, exploit scenario, fix code, fuzzing harness
//     - NEVER discovers findings — only enriches confirmed ones
//
// Architecture principle: AI agents produce signal (low weight: 15).
// Deterministic tools (Slither, Semgrep, AST) produce evidence (weight: 35).
// Multi-tool confirmation raises confidence. Single-agent finding = low confidence.

import Groq                     from 'groq-sdk';
import { GoogleGenerativeAI }   from '@google/generative-ai';
import { z }                    from 'zod';
import { AuditPlan, ErcStandard } from '@auditsmart/shared';
import { childLogger }          from '../lib/logger';
import { RawFinding }           from './normalizer';

const log = childLogger('agent-orchestrator');

// ── Model configuration ────────────────────────────────────────────────────────

const GROQ_MODEL    = process.env.GROQ_MODEL    ?? 'llama-3.3-70b-versatile';
const GEMINI_MODEL  = process.env.GEMINI_MODEL  ?? 'gemini-2.0-flash';
const GROQ_MAX_TOKS = 8_192;
const AGENT_TIMEOUT = 25_000; // 25 seconds per agent

// ── Structured output schema ──────────────────────────────────────────────────
// Agents MUST return this exact schema. Validated with Zod before acceptance.
// Any deviation is discarded — this prevents hallucination pollution.

const AgentFindingSchema = z.object({
  type:        z.string().min(3).max(120),
  severity:    z.enum(['critical', 'high', 'medium', 'low', 'info']),
  lineStart:   z.number().int().min(0),
  lineEnd:     z.number().int().min(0),
  file:        z.string().default('Contract.sol'),
  description: z.string().min(10).max(400),
  codeSnippet: z.string().max(600).default(''),
  swcId:       z.string().regex(/^SWC-\d{3}$|^SWC-000$/).default('SWC-000'),
});

type AgentFinding = z.infer<typeof AgentFindingSchema>;

// ── Shared JSON extraction ─────────────────────────────────────────────────────
// LLMs sometimes wrap JSON in markdown code fences. Strip them.

function extractJsonArray(text: string): unknown[] {
  const stripped = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  // Find the first [ and last ] to extract the array
  const start = stripped.indexOf('[');
  const end   = stripped.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  return JSON.parse(stripped.slice(start, end + 1));
}

function validateFindings(raw: unknown[]): AgentFinding[] {
  const valid: AgentFinding[] = [];
  for (const item of raw) {
    const result = AgentFindingSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    }
  }
  return valid;
}

function toRawFinding(f: AgentFinding, tool: 'groq' | 'gemini', agentName: string): RawFinding {
  return {
    tool,
    agentName,
    detectorName: agentName,
    type:        f.type,
    severity:    f.severity,
    file:        f.file,
    lineStart:   f.lineStart,
    lineEnd:     Math.max(f.lineStart, f.lineEnd),
    description: f.description,
    codeSnippet: f.codeSnippet,
    swcId:       f.swcId,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROQ SPECIALIST AGENTS (8 parallel agents)
// ═══════════════════════════════════════════════════════════════════════════════

const GROQ_AGENTS: Array<{
  name:    string;
  system:  string;
}> = [
  {
    name: 'reentrancy-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in reentrancy vulnerabilities.

Analyse the Solidity contract for ALL forms of reentrancy:
- Single-function reentrancy (withdraw before balance update)
- Cross-function reentrancy (two functions sharing state)
- Cross-contract reentrancy (callbacks from external contracts)
- Read-only reentrancy (view function state manipulation)
- ERC777/callback-based reentrancy vectors

For EACH finding output exactly this JSON structure:
{
  "type": "Reentrancy — [specific variant]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line number>,
  "lineEnd": <line number>,
  "file": "Contract.sol",
  "description": "<≤300 chars: what specifically enables the attack>",
  "codeSnippet": "<exact vulnerable lines, ≤300 chars>",
  "swcId": "SWC-107"
}

If there are NO reentrancy vulnerabilities, respond with exactly: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'access-control-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in access control vulnerabilities.

Analyse the Solidity contract for ALL access control issues:
- Missing ownership checks on privileged functions
- Unprotected initializers (upgradeable contracts)
- Privilege escalation paths
- tx.origin misuse for authentication (SWC-115)
- Unsafe delegatecall to user-supplied addresses (SWC-112)
- Unprotected SELFDESTRUCT (SWC-106)
- Missing role-based access control on admin functions
- Front-runnable ownership transfers

Return each finding as:
{
  "type": "Access Control — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-105|SWC-106|SWC-112|SWC-115|SWC-000"
}

If NO issues found: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'arithmetic-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in arithmetic and numeric vulnerabilities.

Analyse for:
- Integer overflow/underflow (especially pre-0.8.x without SafeMath)
- Unchecked arithmetic blocks (Solidity ^0.8 unchecked{})
- Precision loss in division (integer truncation causing fund loss)
- Rounding direction exploitation
- Flash-loan price manipulation via AMM arithmetic
- Phantom overflow in intermediate calculations
- Division by zero without validation

Return each finding as:
{
  "type": "Arithmetic — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars: exact attack vector>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-101"
}

If NO issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'defi-logic-specialist',
    system: `You are an elite DeFi security researcher specialising in DeFi-specific protocol logic vulnerabilities.

Analyse for:
- Price oracle manipulation (TWAP bypass, spot price manipulation)
- Flash loan attack vectors (single-block price manipulation)
- Sandwich attack exposure (slippage tolerance misuse)
- Liquidity manipulation vulnerabilities
- AMM math exploits (constant product formula edge cases)
- Reward calculation errors (staking, yield farming)
- Token rebasing / fee-on-transfer token mishandling
- Front-running of time-sensitive operations (auctions, liquidations)
- MEV extraction vectors

Return each finding as:
{
  "type": "DeFi Logic — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars: exact DeFi attack path>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-000"
}

If NO DeFi vulnerabilities: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'oracle-manipulation-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in oracle manipulation and price feed vulnerabilities.

Analyse for:
- Single-source price oracle reliance (no TWAP)
- Stale price tolerance (missing staleness check on Chainlink)
- Chainlink roundId validation missing
- On-chain price manipulation via flash loans
- Missing L2 sequencer uptime feed check
- Oracle return value not validated (price = 0 accepted)
- Indirect price manipulation through low-liquidity pools
- Missing circuit breakers on extreme price moves

Return each finding as:
{
  "type": "Oracle — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-000"
}

If NO oracle issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'signature-replay-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in cryptographic signature vulnerabilities.

Analyse for:
- Missing nonce in signatures (replay attack)
- Missing chain ID in signatures (cross-chain replay)
- Missing contract address binding (cross-contract replay)
- ECDSA signature malleability (SWC-117)
- ecrecover returning address(0) not handled (SWC-122)
- Signature griefing (front-running signature submission)
- EIP-712 domain separator issues
- Missing signature expiry / deadline
- Permit function front-running

Return each finding as:
{
  "type": "Signature — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-117|SWC-121|SWC-122|SWC-000"
}

If NO signature issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'proxy-upgrade-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in proxy and upgradeable contract vulnerabilities.

Analyse for:
- Storage layout collision (implementation vs proxy slot)
- Uninitialized implementation contract (re-initialisation attack)
- Missing storage gap in upgradeable base contracts
- Delegatecall to untrusted/user-supplied address (SWC-112)
- Function selector clashing between proxy and implementation
- Admin slot collision (EIP-1967 deviations)
- Self-destruct in implementation contract
- Incorrect initializer() modifier (not initializing parent)
- Missing upgradeability timelock / governance

Return each finding as:
{
  "type": "Proxy/Upgrade — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-112|SWC-000"
}

If NO proxy/upgrade issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'dos-griefing-specialist',
    system: `You are an elite smart contract security researcher specialising EXCLUSIVELY in denial-of-service and griefing vulnerabilities.

Analyse for:
- Unbounded loops over user-controlled arrays (block gas limit DoS)
- External calls inside loops (DoS via reverting callee)
- Pulling funds from contract that can reject ETH
- Push payment pattern to untrusted addresses
- Dependence on block.timestamp for critical timing (SWC-116)
- Dependence on block.number for timing assumptions
- Storage-based DoS (writing to many slots in one tx)
- msg.value in loop (SWC-113)
- Unexpected ether received via selfdestruct/coinbase

Return each finding as:
{
  "type": "DoS/Griefing — [specific issue]",
  "severity": "critical|high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-113|SWC-116|SWC-128|SWC-132|SWC-000"
}

If NO DoS/griefing issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI SPECIALIST AGENTS (2 agents, large-context tasks)
// ═══════════════════════════════════════════════════════════════════════════════

const GEMINI_AGENTS: Array<{
  name:   string;
  system: string;
}> = [
  {
    name: 'gas-optimization-analyst',
    system: `You are a Solidity gas optimization specialist. Analyse the contract for gas inefficiencies that could harm users in high-volume protocols.

Focus on:
- Storage reads/writes in loops (should use memory cache)
- Redundant SLOAD where state var read multiple times in same function
- Using uint256 where uint128/uint64 would suffice (packing)
- Missing calldata vs memory for external function params
- Emitting events for data that should be calldata (expensive)
- Not using custom errors (string revert messages waste gas)
- Initializing variables to default values (wastes gas)
- Public functions that could be external

Return each as:
{
  "type": "Gas — [specific waste]",
  "severity": "info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars: estimated gas impact>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-000"
}

If NO gas issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },

  {
    name: 'erc-compliance-analyst',
    system: `You are an ERC standards compliance specialist. Analyse the contract for ERC standard violations that could cause integration failures.

Check:
- ERC-20: return value on transfer/transferFrom, approve race condition, missing events
- ERC-721: safeTransferFrom checks, tokenURI returning correct format
- ERC-1155: batch transfer events, balance of zero for nonexistent tokens
- ERC-4626: share/asset precision rounding direction (must round down for deposit)
- ERC-2612: permit deadline validation, nonce management
- ERC-1967: proxy storage slot compliance
- Missing or incorrect event emissions for state changes
- Interface function signature deviations (return type mismatches)

Return each as:
{
  "type": "ERC Compliance — [standard]-[specific violation]",
  "severity": "high|medium|low|info",
  "lineStart": <line>, "lineEnd": <line>,
  "file": "Contract.sol",
  "description": "<≤300 chars: which integration will break and why>",
  "codeSnippet": "<exact lines, ≤300 chars>",
  "swcId": "SWC-000"
}

If NO compliance issues: []
RESPOND WITH ONLY A JSON ARRAY. NO PROSE.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// RUNNER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function runGroqAgent(
  client:     Groq,
  agentName:  string,
  system:     string,
  code:       string,
): Promise<RawFinding[]> {
  const timer = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error(`${agentName} timed out`)), AGENT_TIMEOUT)
  );

  try {
    const resp = await Promise.race([
      client.chat.completions.create({
        model:      GROQ_MODEL,
        max_tokens: GROQ_MAX_TOKS,
        temperature: 0.1,   // low temperature for more consistent structured output
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: `Analyse this Solidity contract:\n\`\`\`solidity\n${code.slice(0, 80_000)}\n\`\`\`` },
        ],
      }),
      timer,
    ]);

    if (!resp) return [];

    const text  = (resp as any).choices[0]?.message?.content?.trim() ?? '[]';
    const raw   = extractJsonArray(text);
    const valid = validateFindings(raw);

    log.debug({ agent: agentName, found: valid.length }, 'Groq agent done');
    return valid.map((f) => toRawFinding(f, 'groq', agentName));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn({ agent: agentName, err: msg }, 'Groq agent failed — skipped');
    return [];
  }
}

async function runGeminiAgent(
  client:    GoogleGenerativeAI,
  agentName: string,
  system:    string,
  code:      string,
): Promise<RawFinding[]> {
  try {
    const model  = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `${system}\n\nAnalyse this Solidity contract:\n\`\`\`solidity\n${code.slice(0, 200_000)}\n\`\`\``;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${agentName} timed out`)), AGENT_TIMEOUT)
      ),
    ]);

    const text  = result.response.text().trim();
    const raw   = extractJsonArray(text);
    const valid = validateFindings(raw);

    log.debug({ agent: agentName, found: valid.length }, 'Gemini agent done');
    return valid.map((f) => toRawFinding(f, 'gemini', agentName));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn({ agent: agentName, err: msg }, 'Gemini agent failed — skipped');
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentPipelineResult {
  findings:        RawFinding[];
  groqAgentsRan:   number;
  geminiAgentsRan: number;
  durationMs:      number;
}

export async function runAgentPipeline(
  contractCode:  string,
  contractName:  string,
  plan:          AuditPlan,
  ercStandards:  ErcStandard[],
): Promise<AgentPipelineResult> {
  const start          = Date.now();
  const groqKey        = process.env.GROQ_API_KEY;
  const geminiKey      = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    log.warn('No GROQ_API_KEY or GEMINI_API_KEY — agent pipeline skipped');
    return { findings: [], groqAgentsRan: 0, geminiAgentsRan: 0, durationMs: 0 };
  }

  const allFindings: RawFinding[] = [];
  const promises: Promise<RawFinding[]>[] = [];

  // ── Launch Groq agents (all 8 in parallel) ─────────────────────────────────
  if (groqKey) {
    const groq = new Groq({ apiKey: groqKey });

    // For deep audits, run all 8 agents.
    // For free tier, run only the 3 most impactful to conserve tokens.
    const agentsToRun = plan === 'free'
      ? GROQ_AGENTS.slice(0, 3)  // reentrancy, access-control, arithmetic
      : GROQ_AGENTS;             // all 8

    for (const agent of agentsToRun) {
      promises.push(runGroqAgent(groq, agent.name, agent.system, contractCode));
    }

    log.info({ agentCount: agentsToRun.length, plan }, 'Groq agents launched');
  }

  // ── Launch Gemini agents (gas + compliance) ────────────────────────────────
  let geminiAgentCount = 0;
  if (geminiKey) {
    const gemini = new GoogleGenerativeAI(geminiKey);

    // Only run Gemini on pro+ plans — it's slower than Groq
    if (plan !== 'free') {
      // Filter to relevant ERC compliance agents based on declared standards
      const geminiToRun = ercStandards.length > 0
        ? GEMINI_AGENTS                      // run compliance + gas if ERC standards declared
        : GEMINI_AGENTS.slice(0, 1);         // gas only if no ERC context

      for (const agent of geminiToRun) {
        promises.push(runGeminiAgent(gemini, agent.name, agent.system, contractCode));
      }

      geminiAgentCount = geminiToRun.length;
      log.info({ agentCount: geminiAgentCount }, 'Gemini agents launched');
    }
  }

  // ── Collect all results ────────────────────────────────────────────────────
  const settled = await Promise.allSettled(promises);

  let groqCount  = 0;
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      allFindings.push(...result.value);
      groqCount++;
    }
  }

  const durationMs = Date.now() - start;
  log.info({
    totalFindings:   allFindings.length,
    groqAgentsRan:   Math.max(0, groqCount - geminiAgentCount),
    geminiAgentsRan: geminiAgentCount,
    durationMs,
  }, 'Agent pipeline complete');

  return {
    findings:        allFindings,
    groqAgentsRan:   Math.max(0, groqCount - geminiAgentCount),
    geminiAgentsRan: geminiAgentCount,
    durationMs,
  };
}
