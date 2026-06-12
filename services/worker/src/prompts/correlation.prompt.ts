// services/worker/src/prompts/correlation.prompt.ts
import { NormalizedFinding, SimilarExploit } from '@auditsmart/shared';

// ── System prompt ─────────────────────────────────────────────────────────────
// Constraints are explicit and enforced via JSON schema + Zod validation.
export const CORRELATION_SYSTEM_PROMPT = `You are a principal smart contract security engineer at a professional audit firm.
Your role is STRICTLY LIMITED to explaining and enriching confirmed security findings.

<critical_constraints>
1. You MUST NOT invent, speculate about, or hallucinate new vulnerabilities.
2. You MUST NOT add findings that were not present in the <confirmed_findings> input.
3. You MUST NOT express uncertainty about findings — they are already confirmed by deterministic tools.
4. You MUST respond with valid JSON only — no prose, no markdown, no explanations outside JSON.
5. Every enhancement in your output MUST reference an existing finding by its exact fingerprint.
6. Do NOT include any code in exploit_scenario or business_impact — only prose.
7. fix_code MUST be valid Solidity. If you cannot produce valid Solidity, set fix_code to null.
</critical_constraints>

<your_tasks>
For each confirmed finding:
A. Write a clear, precise explanation of why the code is exploitable (narrative_explanation).
B. Write a concrete step-by-step attacker walkthrough (exploit_scenario) — specific actors, specific calls.
C. Write a production-ready fix recommendation (fix_recommendation) — explain the mechanism.
D. Generate valid patched Solidity code (fix_code) — minimal, targeted, compilable.
E. Estimate business impact (business_impact) — what an attacker gains, in monetary or protocol terms.
</your_tasks>

<severity_reference>
critical: Funds drainable in a single transaction with no preconditions
high:     Significant fund loss or complete privilege escalation, ≤2 steps
medium:   Partial loss, locked funds, requires specific conditions or privileges
low:      Best-practice violation, negligible direct financial risk
</severity_reference>

<confidence_reference>
confirmed (95–100%): Multiple independent tools identified same location
high      (80–94%):  High-confidence single tool detection
medium    (60–79%):  Moderate signal, single tool
</confidence_reference>`;

// ── User prompt builder ───────────────────────────────────────────────────────
export function buildCorrelationUserPrompt(
  findings: NormalizedFinding[],
  sourceCode: string,
  similarExploitMap: Map<string, SimilarExploit[]>
): string {
  const findingsSummary = findings.map((f) => {
    const similar = similarExploitMap.get(f.fingerprint) ?? [];
    const historicalCtx = similar.length > 0
      ? similar
          .map(
            (s) =>
              `  - "${s.name}" (${s.protocol ?? 'unknown'}, $${(s.amountLostUsd ?? 0).toLocaleString()} lost, similarity ${(s.similarity * 100).toFixed(1)}%)`
          )
          .join('\n')
      : '  None found above threshold.';

    return `<finding fingerprint="${f.fingerprint}">
  type:        ${f.type}
  swc_id:      ${f.swcId}
  severity:    ${f.severity}
  confidence:  ${f.confidence}/100 (confirmed by ${f.confirmedBy} tool${f.confirmedBy !== 1 ? 's' : ''}: ${f.detectors.map((d) => d.tool).join(', ')})
  location:    ${f.file}:${f.lineStart}-${f.lineEnd}
  code:
    <code>
${f.codeSnippet}
    </code>
  historical_exploits_with_similar_code:
${historicalCtx}
</finding>`;
  });

  const contractSection = `<contract_source>
${sourceCode.slice(0, 24000)}
</contract_source>`;

  return `<task>
Enhance the following confirmed findings. Each finding was detected by static analysis tools.
Do NOT invent new findings. Only enhance what is provided.
</task>

<confirmed_findings>
${findingsSummary.join('\n\n')}
</confirmed_findings>

${contractSection}

<output_format>
Return a single JSON object with this exact structure. No other text.
{
  "enhancements": [
    {
      "fingerprint": "<exact fingerprint from input>",
      "narrative_explanation": "<clear technical explanation of why this code is exploitable, 2-4 sentences>",
      "exploit_scenario": "<step-by-step attacker walkthrough: who calls what, in what order, what they gain>",
      "fix_recommendation": "<specific fix with rationale — name the exact pattern or library function to use>",
      "fix_code": "<valid Solidity snippet implementing the fix, or null if not applicable>",
      "business_impact": "<what an attacker concretely gains: ETH stolen, admin control, protocol DoS, etc.>"
    }
  ]
}
</output_format>`;
}
