// packages/analysis-core/src/category-map.ts
//
// The missing piece from v3: a deterministic map from each tool's raw detector
// name to (a) the canonical VulnerabilityCategory and (b) that tool's
// calibrated true-positive rate for the category. Without this, the v3
// correlator merged on raw `type` strings that never matched across tools, so
// "multi-tool confirmation" never fired and the AI severity cap had no anchor.
//
// This in-memory table is the build-time default. At runtime it is overlaid by
// the `detector_category_map` Postgres table (see Phase 4 migration), so TPRs
// can be re-calibrated from the validation corpus without a redeploy.
import type { DetectorTool, VulnerabilityCategory } from '@auditsmart/shared';

export interface CategoryMapping {
  category: VulnerabilityCategory;
  swcId: string;
  /** Calibrated P(true positive | this tool fired this detector). */
  tpr: number;
}

type Key = `${DetectorTool}:${string}`;

const k = (tool: DetectorTool, detector: string): Key =>
  `${tool}:${detector.toLowerCase()}` as Key;

// ── Curated detector → category + TPR table ─────────────────────────────────
// TPRs are intentionally conservative; calibrate against the golden corpus.
const TABLE: Record<string, CategoryMapping> = {
  // Slither (deterministic static analysis)
  [k('slither', 'reentrancy-eth')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.85 },
  [k('slither', 'reentrancy-no-eth')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.72 },
  [k('slither', 'reentrancy-benign')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.55 },
  [k('slither', 'arbitrary-send-eth')]: { category: 'access-control', swcId: 'SWC-105', tpr: 0.80 },
  [k('slither', 'suicidal')]: { category: 'access-control', swcId: 'SWC-106', tpr: 0.88 },
  [k('slither', 'unprotected-upgrade')]: { category: 'upgrade-issue', swcId: 'SWC-000', tpr: 0.82 },
  [k('slither', 'uninitialized-state')]: { category: 'logic-error', swcId: 'SWC-109', tpr: 0.78 },
  [k('slither', 'uninitialized-storage')]: { category: 'logic-error', swcId: 'SWC-109', tpr: 0.80 },
  [k('slither', 'controlled-delegatecall')]: { category: 'access-control', swcId: 'SWC-112', tpr: 0.84 },
  [k('slither', 'tx-origin')]: { category: 'access-control', swcId: 'SWC-115', tpr: 0.70 },
  [k('slither', 'incorrect-equality')]: { category: 'logic-error', swcId: 'SWC-132', tpr: 0.50 },
  [k('slither', 'weak-prng')]: { category: 'logic-error', swcId: 'SWC-120', tpr: 0.68 },
  [k('slither', 'timestamp')]: { category: 'front-running', swcId: 'SWC-116', tpr: 0.45 },
  [k('slither', 'unchecked-transfer')]: { category: 'token-logic', swcId: 'SWC-104', tpr: 0.72 },
  [k('slither', 'unchecked-lowlevel')]: { category: 'logic-error', swcId: 'SWC-104', tpr: 0.60 },
  [k('slither', 'divide-before-multiply')]: { category: 'arithmetic', swcId: 'SWC-101', tpr: 0.62 },

  // Mythril (symbolic execution)
  [k('mythril', 'external call to user-supplied address')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.82 },
  [k('mythril', 'state access after external call')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.85 },
  [k('mythril', 'integer arithmetic bugs')]: { category: 'arithmetic', swcId: 'SWC-101', tpr: 0.88 },
  [k('mythril', 'unprotected selfdestruct')]: { category: 'access-control', swcId: 'SWC-106', tpr: 0.90 },
  [k('mythril', 'delegatecall to user-supplied address')]: { category: 'access-control', swcId: 'SWC-112', tpr: 0.86 },
  [k('mythril', 'exception state')]: { category: 'logic-error', swcId: 'SWC-110', tpr: 0.55 },
  [k('mythril', 'dependence on predictable environment variable')]: { category: 'front-running', swcId: 'SWC-116', tpr: 0.50 },

  // Semgrep (pattern match)
  [k('semgrep', 'reentrancy')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.55 },
  [k('semgrep', 'tx-origin')]: { category: 'access-control', swcId: 'SWC-115', tpr: 0.55 },
  [k('semgrep', 'unchecked-call')]: { category: 'logic-error', swcId: 'SWC-104', tpr: 0.45 },
  [k('semgrep', 'arbitrary-send')]: { category: 'access-control', swcId: 'SWC-105', tpr: 0.55 },

  // AST (structural, deterministic but coarse)
  [k('ast', 'ast-reentrancy-detector')]: { category: 'reentrancy', swcId: 'SWC-107', tpr: 0.50 },
  [k('ast', 'ast-tx-origin-detector')]: { category: 'access-control', swcId: 'SWC-115', tpr: 0.65 },
  [k('ast', 'ast-unchecked-call-detector')]: { category: 'logic-error', swcId: 'SWC-104', tpr: 0.40 },
  [k('ast', 'ast-sensitive-storage-detector')]: { category: 'access-control', swcId: 'SWC-136', tpr: 0.60 },

  // Echidna / Foundry counterexamples are handled via exploitability, not TPR,
  // but we keep a near-certain prior for completeness.
  [k('echidna', 'invariant-violated')]: { category: 'logic-error', swcId: 'SWC-000', tpr: 0.99 },
};

// ── Category fallback by SWC id (when a detector is unmapped) ────────────────
const SWC_CATEGORY: Record<string, VulnerabilityCategory> = {
  'SWC-107': 'reentrancy',
  'SWC-115': 'access-control',
  'SWC-105': 'access-control',
  'SWC-106': 'access-control',
  'SWC-112': 'access-control',
  'SWC-101': 'arithmetic',
  'SWC-116': 'front-running',
  'SWC-120': 'logic-error',
  'SWC-104': 'logic-error',
  'SWC-109': 'logic-error',
  'SWC-136': 'access-control',
};

// ── Last-resort keyword inference ───────────────────────────────────────────
const KEYWORD_PATTERNS: Array<[RegExp, VulnerabilityCategory]> = [
  [/reentran/i, 'reentrancy'],
  [/access.?control|owner|admin|role|privile|selfdestruct|delegatecall|tx[._]?origin/i, 'access-control'],
  [/overflow|underflow|arithmetic|safemath|division|rounding/i, 'arithmetic'],
  [/flash.?loan/i, 'flash-loan'],
  [/oracle|price.?manipul/i, 'oracle-manipulation'],
  [/front.?run|mev|sandwich|timestamp/i, 'front-running'],
  [/signature|ecrecover|ecdsa|permit|replay|nonce/i, 'signature'],
  [/denial|dos|gas.?limit|unbounded/i, 'denial-of-service'],
  [/upgrade|proxy|storage.?collision|initializ/i, 'upgrade-issue'],
  [/erc-?\d+|transfer|approve|allowance|rebasing|fee.?on.?transfer/i, 'token-logic'],
];

export interface ResolveInput {
  tool: DetectorTool;
  detectorName: string;
  swcId?: string;
  /** free text (raw type / description) used only for keyword fallback */
  text?: string;
}

export interface ResolvedCategory {
  category: VulnerabilityCategory;
  swcId: string;
  tpr: number;
  /** how the category was determined — for observability/debugging */
  via: 'table' | 'swc' | 'keyword' | 'default';
}

/**
 * Deterministically resolve a raw tool detection to a canonical category + TPR.
 * Pure and total: always returns a result, never throws.
 *
 * @param overlay optional runtime overlay from the DB `detector_category_map`.
 */
export function resolveCategory(
  input: ResolveInput,
  overlay?: ReadonlyMap<string, CategoryMapping>,
): ResolvedCategory {
  const key = k(input.tool, input.detectorName);

  const fromOverlay = overlay?.get(key);
  if (fromOverlay) {
    return { ...fromOverlay, via: 'table' };
  }

  const fromTable = TABLE[key];
  if (fromTable) {
    return { ...fromTable, via: 'table' };
  }

  const swc = input.swcId && input.swcId !== 'SWC-000' ? input.swcId : undefined;
  if (swc && SWC_CATEGORY[swc]) {
    return { category: SWC_CATEGORY[swc]!, swcId: swc, tpr: defaultTpr(input.tool), via: 'swc' };
  }

  const text = `${input.detectorName} ${input.text ?? ''}`;
  for (const [pattern, category] of KEYWORD_PATTERNS) {
    if (pattern.test(text)) {
      return { category, swcId: swc ?? 'SWC-000', tpr: defaultTpr(input.tool), via: 'keyword' };
    }
  }

  return { category: 'other', swcId: swc ?? 'SWC-000', tpr: defaultTpr(input.tool), via: 'default' };
}

/** Conservative per-tool prior when no specific detector mapping exists. */
export function defaultTpr(tool: DetectorTool): number {
  switch (tool) {
    case 'echidna': return 0.99;
    case 'mythril': return 0.75;
    case 'slither': return 0.65;
    case 'ast': return 0.45;
    case 'semgrep': return 0.45;
    case 'ai':
    case 'groq':
    case 'gemini': return 0.35;
    default: return 0.40;
  }
}

/** Lookup TPR for an already-categorised detection (used by confidence.ts). */
export function tprFor(
  tool: DetectorTool,
  detectorName: string,
  overlay?: ReadonlyMap<string, CategoryMapping>,
): number {
  const key = k(tool, detectorName);
  return overlay?.get(key)?.tpr ?? TABLE[key]?.tpr ?? defaultTpr(tool);
}

/** Exposed for the seed script (Phase 4) so DB and code stay in sync. */
export function defaultCategoryTable(): ReadonlyMap<string, CategoryMapping> {
  return new Map(Object.entries(TABLE));
}
