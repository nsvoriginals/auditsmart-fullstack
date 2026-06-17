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
import { AI_TOOLS, type FindingV4, type Exploitability } from './types.js';

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

// ── Evidence hierarchy (Rule 4) ─────────────────────────────────────────────
// 0 AI speculation · 1 static · 2 multi-tool · 3 dynamic (symbolic/fuzz) ·
// 4 executable exploit reproduction · 5 human-verified.
export type EvidenceLevel = 0 | 1 | 2 | 3 | 4 | 5;

// ponytail: Level 5 needs a human-review field that doesn't exist yet, so it is
// never returned today — wire it when human sign-off is modeled.
const DYNAMIC_TOOLS = new Set<FindingV4['detectors'][number]['tool']>(['echidna', 'mythril']);

/** Classify a finding into the evidence hierarchy from its detectors + proof. */
export function evidenceLevel(finding: FindingV4): EvidenceLevel {
  if (finding.exploitability === 'proven') return 4; // executable reproduction
  const tools = new Set(finding.detectors.map((d) => d.tool));
  const nonAi = [...tools].filter((t) => !AI_TOOLS.has(t));
  if (nonAi.length === 0) return 0; // AI only
  if (nonAi.some((t) => DYNAMIC_TOOLS.has(t))) return 3; // symbolic/fuzz ran
  if (nonAi.length >= 2) return 2; // multi-tool agreement
  return 1; // single static tool
}

export interface ConfidenceExplanation {
  confidence: number;
  evidenceLevel: EvidenceLevel;
  exploitability: Exploitability;
  /** One independent vote per tool, with the calibrated TPR used. */
  tools: { tool: FindingV4['detectors'][number]['tool']; detectorName: string; tpr: number }[];
  /** Π(1 − TPR): probability every tool is wrong. */
  pAllWrong: number;
  /** Raw Bayesian confidence before any cap/floor: (1 − pAllWrong) × 100. */
  bayesian: number;
  capApplied: 'ai-ceiling' | 'proven-floor' | null;
  /** Human-readable derivation — no magic numbers (Rule 3). */
  formula: string;
}

/**
 * Reproducible, fully-explained confidence (Rule 3). The SINGLE source of the
 * confidence math; `computeConfidence` delegates here so the number a user sees
 * always matches the published derivation.
 */
export function explainConfidence(finding: FindingV4, opts: ConfidenceOptions = {}): ConfidenceExplanation {
  const overlay = opts.overlay;
  const aiCeiling = opts.aiOnlyCeiling ?? AI_ONLY_CEILING;
  const provenFloor = opts.provenFloor ?? PROVEN_FLOOR;
  const level = evidenceLevel(finding);

  // One vote per distinct tool (multiple detectors from one tool aren't
  // independent evidence).
  const byTool = new Map<string, { tool: FindingV4['detectors'][number]['tool']; detectorName: string }>();
  for (const d of finding.detectors) {
    if (!byTool.has(d.tool)) byTool.set(d.tool, { tool: d.tool, detectorName: d.detectorName });
  }
  const tools = [...byTool.values()].map((t) => ({
    ...t,
    tpr: clamp01(tprFor(t.tool, t.detectorName, overlay)),
  }));

  if (tools.length === 0) {
    return {
      confidence: 0, evidenceLevel: level, exploitability: finding.exploitability,
      tools: [], pAllWrong: 1, bayesian: 0, capApplied: null,
      formula: 'no tools → confidence 0',
    };
  }

  // P(none of the tools is right) = Π (1 − TPR)
  let pAllWrong = 1;
  for (const t of tools) pAllWrong *= 1 - t.tpr;
  const bayesian = (1 - pAllWrong) * 100;

  let confidence = bayesian;
  let capApplied: ConfidenceExplanation['capApplied'] = null;
  if (finding.exploitability === 'proven') {
    if (provenFloor > confidence) { confidence = provenFloor; capApplied = 'proven-floor'; }
  } else if (tools.every((t) => AI_TOOLS.has(t.tool))) {
    if (aiCeiling < confidence) { confidence = aiCeiling; capApplied = 'ai-ceiling'; }
  }

  const product = tools.map((t) => `(1−${t.tpr.toFixed(2)})`).join('×');
  const capNote =
    capApplied === 'proven-floor' ? ` → proven floor ${provenFloor}` :
    capApplied === 'ai-ceiling' ? ` → AI-only ceiling ${aiCeiling}` : '';
  const formula = `P(true)=1−${product}=${(bayesian / 100).toFixed(3)} → ${bayesian.toFixed(1)}%${capNote} (evidence L${level})`;

  return {
    confidence: clampInt(confidence, 1, 99),
    evidenceLevel: level, exploitability: finding.exploitability,
    tools, pAllWrong, bayesian, capApplied, formula,
  };
}

/**
 * Compute Bayesian confidence for one finding. Pure; returns a NEW finding with
 * `confidence` set (does not mutate input). Delegates to `explainConfidence` so
 * the score and its derivation can never diverge.
 */
export function computeConfidence(finding: FindingV4, opts: ConfidenceOptions = {}): FindingV4 {
  return { ...finding, confidence: explainConfidence(finding, opts).confidence };
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
