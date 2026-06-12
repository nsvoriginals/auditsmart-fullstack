// services/worker/src/prompts/harness.prompt.ts
import { NormalizedFinding } from '@auditsmart/shared';

export const HARNESS_SYSTEM_PROMPT = `You are an expert in Echidna property-based fuzzing for Solidity smart contracts.
Your ONLY task is to generate a valid Solidity fuzzing harness that Echidna can compile and run.

<rules>
1. Output ONLY valid Solidity code — no explanations, no markdown, no prose.
2. The harness MUST compile with solc 0.8.x.
3. Define at least one echidna_* function per confirmed vulnerability.
4. echidna_* functions MUST return bool.
5. They return true when the invariant HOLDS (i.e., the system is safe).
6. They return false when the invariant is VIOLATED (i.e., the bug is triggered).
7. Import the target contract using a relative path stub: import "./TargetContract.sol";
8. The harness contract name MUST be exactly: AuditSmartFuzzHarness
9. Only use Solidity ≥ 0.8.0 safe arithmetic (no SafeMath import needed).
10. Do NOT use try/catch — Echidna does not support it well.
</rules>`;

export function buildHarnessUserPrompt(
  contractCode: string,
  findings: NormalizedFinding[],
  contractName: string
): string {
  const targetedFindings = findings
    .filter((f) => ['critical', 'high'].includes(f.severity))
    .slice(0, 5); // Cap at 5 to keep harness manageable

  const findingDescriptions = targetedFindings.map((f, i) => `
Finding #${i + 1}:
  type:     ${f.type}
  swc_id:   ${f.swcId}
  location: ${f.file}:${f.lineStart}-${f.lineEnd}
  snippet:
    ${f.codeSnippet.split('\n').join('\n    ')}
  exploit:  ${f.exploitScenario ?? 'Attacker calls the vulnerable function with crafted inputs.'}`
  ).join('\n');

  return `Target contract: ${contractName}

<contract_source>
${contractCode.slice(0, 6000)}
</contract_source>

<confirmed_vulnerability_targets>
${findingDescriptions}
</confirmed_vulnerability_targets>

Generate a complete Echidna fuzzing harness that:
1. Imports and deploys the target contract in its constructor.
2. Defines one echidna_* invariant function per finding above.
3. Names each invariant clearly, e.g. echidna_no_reentrancy_drain(), echidna_balance_invariant().
4. Uses realistic state setup: fund the harness contract with ETH, call setup functions, etc.

Output ONLY the Solidity source code. No other text.`;
}
