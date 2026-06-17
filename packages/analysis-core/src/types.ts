// packages/analysis-core/src/types.ts
//
// v4 finding types. These EXTEND the canonical shapes in @auditsmart/shared
// rather than redefining them — analysis-core is now the SINGLE home for the
// normalize → correlate → confidence logic. The former duplicate copies
// (services/worker's local engine and packages/analyzer-sdk) have been removed;
// the worker maps its analyzer output (RawFinding) straight into this package.
//
// All imports are type-only: nothing from @auditsmart/shared is pulled in at
// runtime, so this package's pure functions run standalone (and under tsx
// `node --test`) without workspace linking.
import type {
  DetectorTool,
  FindingSeverity,
  ToolDetection,
  VulnerabilityCategory,
  SimilarExploit,
} from '@auditsmart/shared';

export type {
  DetectorTool,
  FindingSeverity,
  ToolDetection,
  VulnerabilityCategory,
  SimilarExploit,
};

/**
 * Whether a finding has been PROVEN exploitable, or is only suspected.
 * `proven` is set EXCLUSIVELY by Echidna counterexamples or a passing Foundry
 * PoC — no static tool and no AI path may ever assign it. This is the v4
 * differentiator: "we drained it in a fork" vs "the model thinks it's bad".
 */
export type Exploitability = 'proven' | 'likely' | 'theoretical' | 'unconfirmed';

export const EXPLOITABILITY_RANK: Record<Exploitability, number> = {
  proven: 4,
  likely: 3,
  theoretical: 2,
  unconfirmed: 1,
};

/** The kind of evidence a tool produced — drives how much it can be trusted. */
export type EvidenceKind = 'static' | 'symbolic' | 'fuzz' | 'concrete';

export interface Evidence {
  tool: DetectorTool;
  kind: EvidenceKind;
  detail: string;
  /** EVM execution trace (Mythril) or fuzz counterexample (Echidna). */
  trace?: string;
}

/**
 * The canonical v4 finding. Superset of the shared NormalizedFinding with the
 * two fields the v4 design adds: `exploitability` and structured `evidence`.
 */
export interface FindingV4 {
  id: string;
  fingerprint: string;

  // location
  file: string;
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  fn?: string;

  // classification (controlled vocabulary)
  type: string;
  swcId: string;
  cweIds: string[];
  category: VulnerabilityCategory;

  // deterministic scoring
  severity: FindingSeverity;
  confidence: number; // 0–100, Bayesian — set by computeConfidence
  confirmedBy: number; // count of independent tools
  exploitability: Exploitability;

  detectors: ToolDetection[];
  evidence: Evidence[];

  // AI enhancement layer (surfaced to the user — unlike v3 which dropped it)
  narrativeExplanation?: string;
  exploitScenario?: string;
  fixRecommendation?: string;
  fixCode?: string;
  businessImpact?: string;
  similarExploits?: SimilarExploit[];
}

export const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

/** AI/LLM tools — findings backed ONLY by these are confidence-capped. */
export const AI_TOOLS: ReadonlySet<DetectorTool> = new Set<DetectorTool>([
  'ai',
  'groq',
  'gemini',
]);
