// packages/analysis-core/src/confidence.ts
//
// v4 confidence engine. Replaces v3's additive point system (which scored
// phantom tools `mythril:40`/`echidna:50` that never ran, and whose
// MULTI_TOOL_BONUS never fired because the correlator never merged across
// tools).
//
// v4 treats each independent tool confirmation as Bayesian evidence and
// combines via the complement of all tools being wrong:
//
//     P(true) = 1 - Π (1 - TPR_tool)
//
// The load-bearing invariant — enforced HERE in code, not in a prompt — is the
// AI ceiling: a finding backed only by LLM tools can never exceed
// AI_ONLY_CEILING confidence, which is below the ship threshold. This is what
// structurally prevents the AI from acting as the primary detector.
import type { CategoryMapping } from './category-map.js';
import { tprFor } from './category-map.js';
import { AI_TOOLS, type FindingV4 } from './types.js';

/** Findings backed only by AI tools are capped below the ship threshold. */
export const AI_ONLY_CEILING = 50;

/** Default confidence floor below which a finding is not shown to users. */
export const SHIP_THRESHOLD = 55;

/** A proven exploit (Echidna/Foundry counterexample) is always near-certain. */
export const PROVEN_FLOOR = 95;

export interface ConfidenceOptions {
  /** Runtime overlay from the detector_category_map DB table. */
  overlay?: ReadonlyMap<string, CategoryMapping>;
  aiOnlyCeiling?: number;
  provenFloor?: number;
}

/**
 * Compute Bayesian confidence for one finding. Pure; returns a NEW finding with
 * `confidence` set (does not mutate input).
 */
export function computeConfidence(finding: FindingV4, opts: ConfidenceOptions = {}): FindingV4 {
  const overlay = opts.overlay;
  const aiCeiling = opts.aiOnlyCeiling ?? AI_ONLY_CEILING;
  const provenFloor = opts.provenFloor ?? PROVEN_FLOOR;

  // One vote per distinct tool (multiple detectors from the same tool are not
  // independent evidence).
  const byTool = new Map<string, { tool: FindingV4['detectors'][number]['tool']; detectorName: string }>();
  for (const d of finding.detectors) {
    if (!byTool.has(d.tool)) byTool.set(d.tool, { tool: d.tool, detectorName: d.detectorName });
  }

  const tools = [...byTool.values()];
  if (tools.length === 0) {
    return { ...finding, confidence: 0 };
  }

  // P(none of the tools is right) = Π (1 - TPR)
  let pAllWrong = 1;
  for (const t of tools) {
    const tpr = clamp01(tprFor(t.tool, t.detectorName, overlay));
    pAllWrong *= 1 - tpr;
  }
  let confidence = (1 - pAllWrong) * 100;

  // Proven floor: a fuzz/PoC counterexample dominates everything.
  if (finding.exploitability === 'proven') {
    confidence = Math.max(confidence, provenFloor);
  } else {
    // AI ceiling: if EVERY contributing tool is an LLM, cap hard.
    const allAi = tools.every((t) => AI_TOOLS.has(t.tool));
    if (allAi) confidence = Math.min(confidence, aiCeiling);
  }

  return { ...finding, confidence: clampInt(confidence, 1, 99) };
}

/** Batch helper. */
export function scoreAll(findings: readonly FindingV4[], opts?: ConfidenceOptions): FindingV4[] {
  return findings.map((f) => computeConfidence(f, opts));
}

/** Whether a scored finding clears the threshold to be shown to a user. */
export function isShippable(finding: FindingV4, threshold = SHIP_THRESHOLD): boolean {
  return finding.confidence >= threshold;
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function clampInt(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(x)));
}
