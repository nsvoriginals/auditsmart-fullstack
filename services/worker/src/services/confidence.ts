// services/worker/src/services/confidence.ts
// Evidence-based confidence scoring — zero LLM opinion involved.
// Points are awarded for tool evidence strength, not AI agreement.
import { NormalizedFinding } from '@auditsmart/shared';

// Evidence weights per tool
const TOOL_WEIGHTS: Record<string, number> = {
  mythril:  40,  // symbolic execution — strong evidence
  echidna:  50,  // fuzzer counterexample — strongest evidence
  slither:  35,  // deterministic static analysis (100+ detectors)
  semgrep:  20,  // pattern match — moderate confidence
  ast:      25,  // deterministic structural check
  groq:     15,  // LLM agent — lowest weight (can hallucinate)
  gemini:   15,  // LLM agent — lowest weight (can hallucinate)
};

// Bonus for multiple independent tools confirming the same finding
const MULTI_TOOL_BONUS = 15;

export function computeConfidence(finding: NormalizedFinding): NormalizedFinding {
  let points = 0;

  const toolsSeen = new Set<string>();
  for (const detector of finding.detectors) {
    const w = TOOL_WEIGHTS[detector.tool] ?? 10;
    points += w;
    toolsSeen.add(detector.tool);
  }

  // Bonus if more than one distinct tool confirmed
  if (toolsSeen.size > 1) {
    points += MULTI_TOOL_BONUS;
  }

  // Severity bump: critical/high findings start with higher floor
  const severityFloor: Record<string, number> = {
    critical: 60,
    high:     45,
    medium:   30,
    low:      20,
    info:     10,
  };
  const floor = severityFloor[finding.severity] ?? 20;

  const confidence = Math.min(99, Math.max(floor, points));

  return { ...finding, confidence };
}
