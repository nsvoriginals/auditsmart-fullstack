// packages/analyzer-sdk/src/correlator.ts
// Deduplicates findings that report the same vulnerability at the same location
// as detected by different tools. Merges their ToolDetection records.
import type { NormalizedFinding } from '@auditsmart/shared';

// Two findings are considered the same if they share:
// - the same vulnerability type (normalized)
// - the same file
// - overlapping line ranges within a 5-line slack
const LINE_SLACK = 5;

export function correlateByLocation(findings: NormalizedFinding[]): NormalizedFinding[] {
  const clusters: NormalizedFinding[][] = [];

  for (const finding of findings) {
    const existing = clusters.find((cluster) => {
      const rep = cluster[0];
      return (
        normalizeType(rep.type) === normalizeType(finding.type) &&
        rep.file === finding.file &&
        linesOverlap(rep.lineStart, rep.lineEnd, finding.lineStart, finding.lineEnd)
      );
    });

    if (existing) {
      existing.push(finding);
    } else {
      clusters.push([finding]);
    }
  }

  // Merge each cluster into a single finding
  return clusters.map(mergeFindingCluster);
}

function mergeFindingCluster(cluster: NormalizedFinding[]): NormalizedFinding {
  if (cluster.length === 1) return cluster[0];

  // Representative: highest severity, then highest confidence
  const rep = cluster.reduce((best, f) =>
    severityRank(f.severity) > severityRank(best.severity) ? f : best
  );

  // Merge all detectors without duplicating the same tool
  const seenTools = new Set<string>();
  const mergedDetectors = cluster.flatMap((f) =>
    f.detectors.filter((d) => {
      const key = `${d.tool}:${d.detectorName}`;
      if (seenTools.has(key)) return false;
      seenTools.add(key);
      return true;
    })
  );

  // Merge CWE IDs
  const mergedCweIds = [...new Set(cluster.flatMap((f) => f.cweIds))];

  return {
    ...rep,
    detectors:   mergedDetectors,
    confirmedBy: mergedDetectors.length,
    cweIds:      mergedCweIds,
    // Widen line range to cover all occurrences
    lineStart:   Math.min(...cluster.map((f) => f.lineStart)),
    lineEnd:     Math.max(...cluster.map((f) => f.lineEnd)),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_RANKS: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1, info: 0,
};

function severityRank(s: string): number {
  return SEVERITY_RANKS[s] ?? 0;
}

function linesOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number,
): boolean {
  return aStart <= bEnd + LINE_SLACK && bStart <= aEnd + LINE_SLACK;
}

function normalizeType(type: string): string {
  return type.toLowerCase().replace(/[\s\-_]+/g, '');
}
