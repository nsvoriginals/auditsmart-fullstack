// packages/analysis-core/src/normalize.ts
//
// v4 normalizer — the FIRST stage of the analysis-core pipeline
// (normalize → correlate → confidence). Converts each tool's raw detection
// into a canonical single-detector FindingV4, resolving the canonical category
// + SWC + TPR deterministically via the category map.
//
// Two invariants this stage establishes for everything downstream:
//   1. `detectorName` is the RAW detector slug (e.g. "reentrancy-eth"), NOT the
//      human title — so the correlator/confidence TPR lookups actually hit the
//      table. (The v3 path discarded the slug, which is why multi-tool
//      confirmation never fired.)
//   2. `exploitability` starts at the strongest the evidence justifies:
//      a fuzz/PoC counterexample ⇒ `proven`; an AI-only detection ⇒
//      `unconfirmed`; everything else ⇒ `theoretical`. The correlator later
//      takes the max across a merged cluster.
//
// Pure & runtime-standalone: the only @auditsmart/shared import is type-only,
// and the SWC→CWE mapping is injected (opts.swcToCwe) so this package never
// pulls shared in at runtime and keeps running under `node --test`.
import type { DetectorTool, FindingSeverity, ToolDetection } from '@auditsmart/shared';
import { resolveCategory, type CategoryMapping } from './category-map.js';
import { fingerprintOf } from './correlator.js';
import { AI_TOOLS, type Evidence, type EvidenceKind, type Exploitability, type FindingV4 } from './types.js';

/** One tool's single observation at a code location — the pipeline's raw input. */
export interface RawDetection {
  tool: DetectorTool;
  /** Raw detector slug used for category/TPR lookup, e.g. "reentrancy-eth". */
  detectorName: string;
  /** Display/provenance name, e.g. the agent or rule that produced it. */
  agentName?: string;
  type: string;
  severity: FindingSeverity;
  file: string;
  lineStart: number;
  lineEnd: number;
  description?: string;
  codeSnippet?: string;
  swcId?: string;
  /** Raw tool output, kept for the evidence/audit trail. */
  rawOutput?: string;
  /** Mythril EVM execution trace. */
  executionTrace?: string;
  /** Echidna/Foundry counterexample — its presence implies PROVEN. */
  counterExample?: string;
}

export interface NormalizeOptions {
  /** Runtime overlay from the detector_category_map DB table. */
  overlay?: ReadonlyMap<string, CategoryMapping>;
  /** SWC→CWE mapper, injected so analysis-core stays runtime-pure. */
  swcToCwe?: (swcId: string) => string[];
}

const KIND_BY_TOOL: Partial<Record<DetectorTool, EvidenceKind>> = {
  echidna: 'fuzz',
  mythril: 'symbolic',
  slither: 'static',
  semgrep: 'static',
  ast: 'static',
  ai: 'static',
  groq: 'static',
  gemini: 'static',
};

function evidenceKind(tool: DetectorTool): EvidenceKind {
  return KIND_BY_TOOL[tool] ?? 'static';
}

function exploitabilityOf(d: RawDetection): Exploitability {
  if (d.counterExample) return 'proven';
  if (AI_TOOLS.has(d.tool)) return 'unconfirmed';
  return 'theoretical';
}

const SNIPPET_MAX = 500;

/**
 * Normalize raw tool detections into single-detector FindingV4s. Pure: does not
 * mutate inputs. Output is fed directly to `correlate`, then `scoreAll`.
 */
export function normalize(raw: readonly RawDetection[], opts: NormalizeOptions = {}): FindingV4[] {
  const out: FindingV4[] = [];

  for (const d of raw) {
    if (!d.type || !d.severity) continue;

    const lineStart = Math.max(0, d.lineStart || 0);
    const lineEnd = Math.max(lineStart, d.lineEnd || 0);

    const resolved = resolveCategory(
      {
        tool: d.tool,
        detectorName: d.detectorName,
        swcId: d.swcId,
        text: `${d.type} ${d.description ?? ''}`,
      },
      opts.overlay,
    );

    const detector: ToolDetection = {
      tool: d.tool,
      detectorName: d.detectorName,
      ...(d.rawOutput ? { rawOutput: d.rawOutput } : {}),
      ...(d.executionTrace ? { executionTrace: d.executionTrace } : {}),
      ...(d.counterExample ? { counterExample: d.counterExample } : {}),
    };

    const evidence: Evidence = {
      tool: d.tool,
      kind: evidenceKind(d.tool),
      detail: d.agentName ? `${d.agentName}: ${d.type}` : d.type,
      ...(d.executionTrace || d.counterExample
        ? { trace: d.executionTrace ?? d.counterExample }
        : {}),
    };

    out.push({
      id: '',
      fingerprint: fingerprintOf(d.file, resolved.category, lineStart),
      file: d.file || 'Contract.sol',
      lineStart,
      lineEnd,
      codeSnippet: (d.codeSnippet ?? '').slice(0, SNIPPET_MAX),
      type: d.type,
      swcId: resolved.swcId,
      cweIds: opts.swcToCwe?.(resolved.swcId) ?? [],
      category: resolved.category,
      severity: d.severity,
      confidence: 0, // set by computeConfidence
      confirmedBy: 1, // recomputed by the correlator after merge
      exploitability: exploitabilityOf(d),
      detectors: [detector],
      evidence: [evidence],
    });
  }

  return out;
}
