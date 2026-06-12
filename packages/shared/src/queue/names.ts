// packages/shared/src/queue/names.ts
// Single source of truth for every BullMQ queue name and topology.

export const QUEUES = {
  // ── Audit pipeline (ordered by execution stage) ─────────────────────────

  // Stage 1 — Fast deterministic analysis: Slither + Semgrep + AST (<90s)
  AUDIT_FAST:       'audit:fast',

  // Stage 2 — Symbolic execution: Mythril (5–20 min, pro+ plans only)
  AUDIT_SYMBOLIC:   'audit:symbolic',

  // Stage 3 — AI correlation pass — ONLY runs after deterministic tools complete
  AI_ENHANCEMENT:   'audit:ai',

  // Stage 4 — Report assembly + signing + S3 upload
  REPORT_GENERATE:  'audit:report',

  // ── Diff auditing ────────────────────────────────────────────────────────
  // Analyze only changed functions between two contract versions
  DIFF_ANALYZE:     'audit:diff',

  // ── Intelligence pipeline ────────────────────────────────────────────────
  // Embed a text blob and store the vector in pgvector
  EMBEDDING:        'embedding:generate',
  // Ingest a single exploit record into the knowledge base
  EXPLOIT_INGEST:   'exploit:ingest',

  // ── Delivery ─────────────────────────────────────────────────────────────
  // HMAC-signed webhook delivery with exponential retry
  WEBHOOK_DELIVER:  'webhook:deliver',
  // GitHub PR annotation (SARIF + inline comments)
  GITHUB_ANNOTATE:  'github:annotate',

  // ── Fuzzing (future) ─────────────────────────────────────────────────────
  FUZZING:          'audit:fuzzing',
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];

// ── Concurrency per queue per worker process ──────────────────────────────────
// Sized for a single t3.medium (2 vCPU, 4 GB RAM).
// Scale by adding more worker replicas — do NOT just increase concurrency.
// Slither analysis is CPU-bound; too many parallel Slither runs = OOM.
export const QUEUE_CONCURRENCY: Record<QueueName, number> = {
  [QUEUES.AUDIT_FAST]:      2,   // CPU-bound: Slither + Semgrep
  [QUEUES.AUDIT_SYMBOLIC]:  1,   // Very CPU-heavy: Mythril symbolic exec
  [QUEUES.AI_ENHANCEMENT]:  4,   // IO-bound: Claude API calls
  [QUEUES.REPORT_GENERATE]: 3,   // IO-bound: PDF + S3
  [QUEUES.DIFF_ANALYZE]:    3,
  [QUEUES.EMBEDDING]:       5,   // IO-bound: embedding API calls
  [QUEUES.EXPLOIT_INGEST]:  2,
  [QUEUES.WEBHOOK_DELIVER]: 8,   // IO-bound: HTTP delivery
  [QUEUES.GITHUB_ANNOTATE]: 4,
  [QUEUES.FUZZING]:         1,   // Heavy: Echidna fuzzer
};

// ── Per-queue retry profiles ──────────────────────────────────────────────────

export const JOB_OPTIONS = {
  // Standard: 3 retries, exponential backoff
  standard: {
    attempts:         3,
    backoff:          { type: 'exponential' as const, delay: 5_000 },
    removeOnComplete: { count: 200 },
    removeOnFail:     { count: 500 },
  },
  // Critical: more retries, longer backoff (report generation, webhook delivery)
  critical: {
    attempts:         5,
    backoff:          { type: 'exponential' as const, delay: 10_000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 1000 },
  },
  // Best-effort: single attempt, discard on fail (non-blocking enrichment)
  bestEffort: {
    attempts:         1,
    removeOnComplete: { count: 50 },
    removeOnFail:     { count: 100 },
  },
} as const;

export const DEFAULT_JOB_OPTIONS = JOB_OPTIONS.standard;
