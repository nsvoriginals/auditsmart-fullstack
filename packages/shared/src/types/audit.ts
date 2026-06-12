// packages/shared/src/types/audit.ts

export type AuditStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'DETERMINISTIC_COMPLETE'
  | 'AI_ENHANCEMENT_QUEUED'
  | 'COMPLETED'
  | 'FAILED';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingConfidence = 'confirmed' | 'high' | 'medium' | 'low';
export type DetectorTool = 'slither' | 'mythril' | 'semgrep' | 'ast' | 'echidna' | 'ai' | 'groq' | 'gemini';
export type AuditPlan = 'free' | 'starter' | 'pro' | 'enterprise' | 'deep_audit';
export type ErcStandard = 'ERC20' | 'ERC721' | 'ERC1155' | 'ERC4626' | 'ERC2981' | string;

/** A single tool's observation at a specific code location. */
export interface ToolDetection {
  tool: DetectorTool;
  detectorName: string;
  rawOutput?: string;
  executionTrace?: string;   // Mythril EVM trace
  counterExample?: string;   // Echidna fuzz input
  slitherConfidence?: 'High' | 'Medium' | 'Low';
}

/**
 * The canonical finding format used across the entire system.
 * Every tool normalises its output into this shape.
 */
export interface NormalizedFinding {
  id: string;
  /** sha256( file + ':' + lineStart + ':' + lineEnd + ':' + swcId ) */
  fingerprint: string;

  // --- location ---
  file: string;
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;

  // --- classification (controlled vocabulary, never free LLM text) ---
  type: string;          // e.g. "Reentrancy", "MissingOwnerCheck"
  swcId: string;         // SWC-107
  cweIds: string[];      // CWE-362 etc.
  category: VulnerabilityCategory;

  // --- severity derived deterministically ---
  severity: FindingSeverity;
  /** 0–100, computed from ToolDetection evidence — NOT from LLM opinion */
  confidence: number;
  confirmedBy: number;   // count of independent tools

  detectors: ToolDetection[];

  // --- AI enhancement layer (populated after deterministic pass) ---
  narrativeExplanation?: string;
  exploitScenario?: string;
  fixRecommendation?: string;
  fixCode?: string;
  businessImpact?: string;
  similarExploits?: SimilarExploit[];
}

export type VulnerabilityCategory =
  | 'reentrancy'
  | 'access-control'
  | 'arithmetic'
  | 'oracle-manipulation'
  | 'flash-loan'
  | 'signature'
  | 'denial-of-service'
  | 'front-running'
  | 'token-logic'
  | 'logic-error'
  | 'upgrade-issue'
  | 'other';

export interface SimilarExploit {
  id: string;
  name: string;
  protocol: string | null;
  amountLostUsd: number | null;
  swcIds: string[];
  description: string;
  fixPattern: string | null;
  similarity: number; // 0–1 cosine similarity
  exploitTx: string | null;
  date: string | null;
}

export interface WebhookJobData {
  webhookId: string;
  auditId:   string;
  event:     string;
  payload:   Record<string, unknown> & { timestamp?: string };
}

export interface AuditJobData {
  auditId:      string;
  contractCode: string;
  contractName: string;
  chain:        string;
  plan:         AuditPlan;
  ercStandards: ErcStandard[];
  priority:     number;
}

export interface AIEnhancementJobData {
  auditId: string;
  findingIds: string[];
  contractCode: string;
  plan: string;
}

export interface EmbeddingJobData {
  entityType: 'vulnerability_knowledge_base' | 'finding';
  entityId: string;
  text: string;
}

export interface ExploitIngestJobData {
  sourceUrl?: string;
  payload: Partial<ExploitRecord>;
}

export interface ExploitRecord {
  name: string;
  protocol: string | null;
  date: string | null;      // ISO date string
  amountLostUsd: number | null;
  swcIds: string[];
  category: VulnerabilityCategory;
  severity: FindingSeverity;
  codePattern: string;
  description: string;
  exploitTx?: string | null;
  fixPattern: string | null;
  sourceUrl: string | null;
  chain: string;
}
