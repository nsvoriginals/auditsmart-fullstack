// packages/analyzer-sdk/src/confidence.ts
// Evidence-based confidence scoring. Zero LLM opinion involved.
// Canonical weights — every new analyzer declares its evidenceWeight in metadata.
import type { NormalizedFinding } from '@auditsmart/shared';

// Fallback weights for tools not registered via analyzer metadata.
// Prefer registering analyzers with an explicit evidenceWeight.
const FALLBACK_WEIGHTS: Record<string, number> = {
  echidna:  50,  // fuzzer counterexample — strongest evidence
  mythril:  40,  // symbolic execution — strong
  slither:  35,  // high-quality static analysis
  ast:      25,  // structural deterministic checks
  semgrep:  20,  // pattern-matching rules
  groq:     15,  // LLM — lowest weight (can hallucinate)
  ai:       10,  // generic AI label
};

const MULTI_TOOL_BONUS = 15; // reward for independent tool agreement

const SEVERITY_FLOOR: Record<string, number> = {
  critical: 65,
  high:     50,
  medium:   35,
  low:      20,
  info:     10,
};

// ── Overridable weight registry ───────────────────────────────────────────────
// The pipeline populates this from registered AnalyzerMetadata.evidenceWeight.

const registeredWeights = new Map<string, number>(Object.entries(FALLBACK_WEIGHTS));

export function registerToolWeight(toolId: string, weight: number): void {
  registeredWeights.set(toolId, weight);
}

function toolWeight(toolId: string): number {
  return registeredWeights.get(toolId) ?? FALLBACK_WEIGHTS[toolId] ?? 10;
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export function computeConfidence(finding: NormalizedFinding): NormalizedFinding {
  let points = 0;
  const toolsSeen = new Set<string>();

  for (const detector of finding.detectors) {
    points += toolWeight(detector.tool);
    toolsSeen.add(detector.tool);

    // Slither's own confidence rating adjusts points slightly
    if (detector.slitherConfidence === 'High')   points += 5;
    if (detector.slitherConfidence === 'Low')     points -= 5;
  }

  if (toolsSeen.size > 1) {
    points += MULTI_TOOL_BONUS;
  }

  const floor = SEVERITY_FLOOR[finding.severity] ?? 20;
  const confidence = Math.min(99, Math.max(floor, points));

  return { ...finding, confidence };
}
