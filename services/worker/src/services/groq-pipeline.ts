// services/worker/src/services/groq-pipeline.ts
// Parallel Groq-powered agent pipeline — runs 3 specialist agents concurrently.
import Groq from 'groq-sdk';
import { AuditPlan, ErcStandard } from '@auditsmart/shared';
import { childLogger } from '../lib/logger';
import { RawFinding } from './normalizer';

const log    = childLogger('groq-pipeline');
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Model to use — llama-3.3-70b has a 128k context window
const MODEL    = 'llama-3.3-70b-versatile';
const MAX_TOKS = 8192;

// ── Agent prompts ─────────────────────────────────────────────────────────────

const REENTRANCY_AGENT = `You are a senior smart contract security auditor specialising in reentrancy attacks.
Analyse the provided Solidity contract and identify ALL reentrancy vulnerabilities.
For each vulnerability output a JSON array element with fields:
  type (string), severity ("critical"|"high"|"medium"|"low"|"info"),
  lineStart (number), lineEnd (number),
  file ("Contract.sol"), description (string, ≤300 chars), codeSnippet (string, exact lines),
  swcId ("SWC-107" for reentrancy).
Respond with ONLY a JSON array, no prose.`;

const ACCESS_CONTROL_AGENT = `You are a senior smart contract security auditor specialising in access control and privilege escalation.
Analyse the provided Solidity contract for:
  - Missing onlyOwner / access modifiers
  - Unprotected initializers
  - Privilege escalation paths
  - Unsafe delegatecall targets
For each finding output a JSON array element with fields:
  type, severity, lineStart, lineEnd, file ("Contract.sol"), description (≤300 chars), codeSnippet, swcId.
Respond with ONLY a JSON array, no prose.`;

const ARITHMETIC_AGENT = `You are a senior smart contract security auditor specialising in arithmetic issues.
Analyse the provided Solidity contract for:
  - Integer overflow / underflow (pre-0.8 contracts)
  - Unchecked arithmetic blocks
  - Precision loss in division
  - Flash-loan price manipulation vectors
For each finding output a JSON array element with fields:
  type, severity, lineStart, lineEnd, file ("Contract.sol"), description (≤300 chars), codeSnippet, swcId.
Respond with ONLY a JSON array, no prose.`;

// ── Pipeline ──────────────────────────────────────────────────────────────────

interface AgentResult {
  agent: string;
  findings: RawFinding[];
}

async function runAgent(
  agentName: string,
  systemPrompt: string,
  contractCode: string
): Promise<AgentResult> {
  try {
    const resp = await client.chat.completions.create({
      model:      MODEL,
      max_tokens: MAX_TOKS,
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: `\`\`\`solidity\n${contractCode}\n\`\`\`` },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() ?? '[]';

    // Strip markdown fences if the model added them
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
    const raw   = JSON.parse(clean) as Array<Record<string, unknown>>;

    const findings: RawFinding[] = raw
      .filter((f) => typeof f.type === 'string' && typeof f.severity === 'string')
      .map((f) => ({
        tool:        'groq' as const,
        agentName,
        type:        String(f.type),
        severity:    (f.severity as string).toLowerCase() as RawFinding['severity'],
        file:        String(f.file ?? 'Contract.sol'),
        lineStart:   Number(f.lineStart ?? 0),
        lineEnd:     Number(f.lineEnd   ?? 0),
        description: String(f.description ?? ''),
        codeSnippet: String(f.codeSnippet ?? ''),
        swcId:       String(f.swcId ?? ''),
      }));

    log.debug({ agentName, count: findings.length }, 'agent findings');
    return { agent: agentName, findings };
  } catch (err) {
    log.warn({ agentName, err }, 'agent failed — returning empty');
    return { agent: agentName, findings: [] };
  }
}

export async function runGroqAgentPipeline(
  contractCode:  string,
  _contractName: string,
  _plan:         AuditPlan,
  _ercStandards: ErcStandard[]
): Promise<RawFinding[]> {
  if (!process.env.GROQ_API_KEY) {
    log.warn('GROQ_API_KEY not set — skipping Groq pipeline');
    return [];
  }

  const results = await Promise.allSettled([
    runAgent('reentrancy',      REENTRANCY_AGENT,      contractCode),
    runAgent('access-control',  ACCESS_CONTROL_AGENT,  contractCode),
    runAgent('arithmetic',      ARITHMETIC_AGENT,      contractCode),
  ]);

  return results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value.findings : []
  );
}
