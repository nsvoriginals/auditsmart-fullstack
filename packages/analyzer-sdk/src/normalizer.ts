// packages/analyzer-sdk/src/normalizer.ts
// Shared normalization logic extracted from services/worker.
// Single source of truth — all analyzers produce RawAnalyzerFinding;
// this converts them into the canonical NormalizedFinding shape.
import { createHash } from 'crypto';
import type { NormalizedFinding, VulnerabilityCategory } from '@auditsmart/shared';
import { swcToCweIds } from '@auditsmart/shared';
import type { RawAnalyzerFinding } from './types';

// ── Severity normalisation ────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, NormalizedFinding['severity']> = {
  critical:      'critical',
  high:          'high',
  medium:        'medium',
  warning:       'medium',
  warn:          'medium',
  low:           'low',
  informational: 'info',
  info:          'info',
  optimization:  'info',
};

function normalizeSeverity(raw: string): NormalizedFinding['severity'] {
  return SEVERITY_MAP[raw.toLowerCase()] ?? 'info';
}

// ── Category inference ────────────────────────────────────────────────────────

const CATEGORY_PATTERNS: Array<[RegExp, VulnerabilityCategory]> = [
  [/reentran/i,                              'reentrancy'],
  [/access.?control|owner|admin|role|auth/i, 'access-control'],
  [/overflow|underflow|arithmetic|safemath/i,'arithmetic'],
  [/flash.?loan/i,                           'flash-loan'],
  [/oracle|price.?manip/i,                   'oracle-manipulation'],
  [/front.?run|mev|sandwich/i,               'front-running'],
  [/logic|invariant|business/i,              'logic-error'],
  [/denial|dos|gas/i,                        'denial-of-service'],
  [/upgrade|proxy|storage.?collision/i,      'upgrade-issue'],
  [/integer|division/i,                      'arithmetic'],
  [/signature|ecrecover|replay/i,            'signature'],
  [/token|erc20|transfer|approve/i,          'token-logic'],
];

function inferCategory(type: string, swcId: string): VulnerabilityCategory {
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(type)) return category;
  }
  const swc = parseInt(swcId.replace('SWC-', ''), 10);
  if (swc === 107) return 'reentrancy';
  if (swc === 115) return 'access-control';
  if (swc === 101) return 'arithmetic';
  if (swc === 117 || swc === 121 || swc === 122) return 'signature';
  return 'other';
}

// ── Fingerprint ───────────────────────────────────────────────────────────────

function fingerprint(file: string, lineStart: number, lineEnd: number, swcId: string): string {
  return createHash('sha256')
    .update(`${file}:${lineStart}-${lineEnd}:${swcId}`)
    .digest('hex')
    .slice(0, 16);
}

// ── Main export ───────────────────────────────────────────────────────────────

export function normalizeFindings(
  raw:  RawAnalyzerFinding[],
  source: string,
): NormalizedFinding[] {
  const lines = source.split('\n');

  return raw
    .filter((f) => f.title && f.severity)
    .map((f): NormalizedFinding => {
      const lineStart  = Math.max(0, f.lineStart);
      const lineEnd    = Math.max(lineStart, f.lineEnd);
      const swcId      = f.swcId || 'SWC-000';
      const codeSnippet = f.codeSnippet?.trim()
        ? f.codeSnippet.slice(0, 500)
        : lines.slice(Math.max(0, lineStart - 1), lineEnd).join('\n').slice(0, 500);

      return {
        id:          '',
        fingerprint: fingerprint(f.file, lineStart, lineEnd, swcId),
        file:        f.file || 'Contract.sol',
        lineStart,
        lineEnd,
        codeSnippet,
        type:        f.title,
        swcId,
        cweIds:      swcToCweIds(swcId),
        category:    inferCategory(f.title, swcId),
        severity:    normalizeSeverity(f.severity),
        confidence:  50,
        confirmedBy: 1,
        detectors: [{
          tool:             f.tool as any,
          detectorName:     f.detectorId,
          rawOutput:        f.rawOutput,
          executionTrace:   f.executionTrace,
          slitherConfidence: f.toolConfidence as any,
        }],
      };
    });
}
