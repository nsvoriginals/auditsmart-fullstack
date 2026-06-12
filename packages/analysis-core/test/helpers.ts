// packages/analysis-core/test/helpers.ts
import type { ToolDetection } from '@auditsmart/shared';
import type { Evidence, Exploitability, FindingSeverity, FindingV4, VulnerabilityCategory } from '../src/types.js';

let seq = 0;

interface MakeOpts {
  tool?: ToolDetection['tool'];
  detectorName?: string;
  file?: string;
  lineStart?: number;
  lineEnd?: number;
  category?: VulnerabilityCategory;
  severity?: FindingSeverity;
  swcId?: string;
  exploitability?: Exploitability;
  type?: string;
}

/** Build a minimal FindingV4 for one tool's detection. */
export function makeFinding(o: MakeOpts = {}): FindingV4 {
  const tool = o.tool ?? 'slither';
  const detectorName = o.detectorName ?? 'reentrancy-eth';
  const detector: ToolDetection = { tool, detectorName };
  const evidence: Evidence = {
    tool,
    kind: tool === 'mythril' ? 'symbolic' : tool === 'echidna' ? 'fuzz' : 'static',
    detail: `${tool}/${detectorName}`,
  };
  return {
    id: '',
    fingerprint: `fp-${seq++}`,
    file: o.file ?? 'Contract.sol',
    lineStart: o.lineStart ?? 10,
    lineEnd: o.lineEnd ?? 12,
    codeSnippet: '',
    type: o.type ?? detectorName,
    swcId: o.swcId ?? 'SWC-107',
    cweIds: [],
    category: o.category ?? 'reentrancy',
    severity: o.severity ?? 'high',
    confidence: 0,
    confirmedBy: 1,
    exploitability: o.exploitability ?? 'theoretical',
    detectors: [detector],
    evidence: [evidence],
  };
}
