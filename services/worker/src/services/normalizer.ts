// services/worker/src/services/normalizer.ts
//
// The canonical *analyzer output contract*. Every analyzer (Slither, Semgrep,
// AST, Groq/Gemini agents) emits `RawFinding[]`. `audit.worker` maps these to
// `@auditsmart/analysis-core`'s `RawDetection`, which is the SINGLE source of
// truth for normalization → correlation → confidence scoring.
//
// (The previous v3 `normalizeFindings()` + local severity/category/fingerprint
// logic was removed — it duplicated analysis-core's `normalize()`. Only the
// producer-side contract type lives here now.)

export interface RawFinding {
  tool: 'groq' | 'gemini' | 'slither' | 'mythril' | 'semgrep' | 'echidna' | 'ast';
  agentName: string;
  /**
   * Raw detector slug used by analysis-core for canonical category + TPR lookup
   * (e.g. "reentrancy-eth", "reentrancy", "ast-reentrancy-detector"). Distinct
   * from `type` (human title) and `agentName` (provenance). Defaults to
   * `agentName` when a producer has no separate slug.
   */
  detectorName?: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  file: string;
  lineStart: number;
  lineEnd: number;
  description: string;
  codeSnippet: string;
  swcId: string;
}
