// services/worker/src/services/normalizer.ts
// Converts heterogeneous raw findings from Groq agents and AST analysis
// into the canonical NormalizedFinding shape.
import { createHash } from 'crypto';
import { NormalizedFinding, VulnerabilityCategory, swcToCweIds } from '@auditsmart/shared';

export interface RawFinding {
  tool:        'groq' | 'gemini' | 'slither' | 'mythril' | 'semgrep' | 'echidna' | 'ast';
  agentName:   string;
  type:        string;
  severity:    'critical' | 'high' | 'medium' | 'low' | 'info';
  file:        string;
  lineStart:   number;
  lineEnd:     number;
  description: string;
  codeSnippet: string;
  swcId:       string;
}

// ── Severity normalisation ────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, NormalizedFinding['severity']> = {
  critical:         'critical',
  high:             'high',
  medium:           'medium',
  warning:          'medium',
  warn:             'medium',
  low:              'low',
  informational:    'info',
  info:             'info',
  optimization:     'info',
};

function normalizeSeverity(raw: string): NormalizedFinding['severity'] {
  return SEVERITY_MAP[raw.toLowerCase()] ?? 'info';
}

// ── Category inference from type/swcId ───────────────────────────────────────

const CATEGORY_PATTERNS: Array<[RegExp, VulnerabilityCategory]> = [
  [/reentran/i,                          'reentrancy'],
  [/access.?control|owner|admin|role/i,  'access-control'],
  [/overflow|underflow|arithmetic|safemath/i, 'arithmetic'],
  [/flash.?loan/i,                       'flash-loan'],
  [/oracle|price.?manipulation/i,        'oracle-manipulation'],
  [/front.?run|mev|sandwich/i,           'front-running'],
  [/logic|invariant|business/i,          'logic-error'],
  [/denial|dos|gas/i,                    'denial-of-service'],
  [/upgrade|proxy|storage.?collision/i,  'upgrade-issue'],
  [/integer|division/i,                  'arithmetic'],
  [/assembly|delegatecall/i,             'other'],
];

function inferCategory(type: string, swcId: string): VulnerabilityCategory {
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(type)) return category;
  }
  // SWC-based fallback
  const swc = parseInt(swcId.replace('SWC-', ''), 10);
  if (swc === 107) return 'reentrancy';
  if (swc === 115) return 'access-control';
  if (swc === 101) return 'arithmetic';
  return 'other';
}

// ── Fingerprint ───────────────────────────────────────────────────────────────

function fingerprint(file: string, lineStart: number, lineEnd: number, swcId: string): string {
  const key = `${file}:${lineStart}-${lineEnd}:${swcId}`;
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

// ── Main normalizer ───────────────────────────────────────────────────────────

export function normalizeFindings(
  rawFindings: RawFinding[],
  contractCode: string
): NormalizedFinding[] {
  const lines = contractCode.split('\n');

  return rawFindings
    .filter((f) => f.type && f.severity)
    .map((f): NormalizedFinding => {
      const lineStart = Math.max(0, f.lineStart);
      const lineEnd   = Math.max(lineStart, f.lineEnd);

      // If codeSnippet is empty, extract from source
      const codeSnippet = f.codeSnippet?.trim()
        ? f.codeSnippet.slice(0, 500)
        : lines.slice(Math.max(0, lineStart - 1), lineEnd).join('\n').slice(0, 500);

      const swcId = f.swcId || 'SWC-000';
      return {
        id:          '',  // filled after DB insert
        fingerprint: fingerprint(f.file, lineStart, lineEnd, swcId),
        file:        f.file || 'Contract.sol',
        lineStart,
        lineEnd,
        codeSnippet,
        type:        f.type,
        swcId,
        cweIds:      swcToCweIds(swcId),
        category:    inferCategory(f.type, swcId),
        severity:    normalizeSeverity(f.severity),
        confidence:  50,   // baseline — updated by computeConfidence
        confirmedBy: 1,
        detectors:   [{ tool: f.tool, detectorName: f.agentName }],
      };
    });
}
