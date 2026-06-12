// services/worker/src/services/correlator.ts
// Deduplicates findings by location proximity and type.
// Two findings are correlated if they share a type AND their line ranges overlap
// or are within LOCATION_SLACK lines of each other.
import { NormalizedFinding } from '@auditsmart/shared';

const LOCATION_SLACK = 5; // lines

export function correlateByLocation(findings: NormalizedFinding[]): NormalizedFinding[] {
  if (findings.length === 0) return [];

  // Sort: same file → ascending line, then by type for deterministic grouping
  const sorted = [...findings].sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.lineStart !== b.lineStart) return a.lineStart - b.lineStart;
    return a.type.localeCompare(b.type);
  });

  const merged: NormalizedFinding[] = [];

  outer: for (const candidate of sorted) {
    for (const existing of merged) {
      if (
        existing.file === candidate.file &&
        existing.type === candidate.type &&
        linesOverlapOrAdjacent(existing, candidate)
      ) {
        // Merge: expand line range, accumulate detectors, take highest severity
        existing.lineEnd    = Math.max(existing.lineEnd, candidate.lineEnd);
        existing.confirmedBy++;
        existing.detectors  = [...existing.detectors, ...candidate.detectors];
        existing.severity   = higherSeverity(existing.severity, candidate.severity);
        // Keep the fingerprint of the first occurrence (stable across re-runs)
        continue outer;
      }
    }
    merged.push({ ...candidate });
  }

  return merged;
}

function linesOverlapOrAdjacent(
  a: { lineStart: number; lineEnd: number },
  b: { lineStart: number; lineEnd: number }
): boolean {
  return (
    b.lineStart <= a.lineEnd   + LOCATION_SLACK &&
    a.lineStart <= b.lineEnd   + LOCATION_SLACK
  );
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 5,
  high:     4,
  medium:   3,
  low:      2,
  info:     1,
};

function higherSeverity(
  a: NormalizedFinding['severity'],
  b: NormalizedFinding['severity']
): NormalizedFinding['severity'] {
  return (SEVERITY_RANK[a] ?? 0) >= (SEVERITY_RANK[b] ?? 0) ? a : b;
}
