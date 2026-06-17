// services/worker/src/workers/audit.worker.ts
import { Worker, Job } from 'bullmq';
import { AgentType, Prisma } from '@prisma/client';
import { QUEUES, QUEUE_CONCURRENCY, AuditJobData, AIEnhancementJobData, swcToCweIds } from '@auditsmart/shared';
import { normalize, correlate, scoreAll, type RawDetection, type FindingV4 } from '@auditsmart/analysis-core';
import { redisConnection } from '../lib/redis';
import { prisma } from '../lib/db';
import { childLogger } from '../lib/logger';
import { metrics } from '../lib/metrics';
import { addToQueue } from '../lib/queues';
import { runAgentPipeline }     from '../services/agent-orchestrator';
import { runASTAnalysis }       from '../services/ast-analysis';
import { runSlitherAnalysis, isSlitherAvailable } from '../services/slither-client';
import { runSemgrepAnalysis }   from '../services/semgrep';
import type { RawFinding }      from '../services/normalizer';

const log = childLogger('audit-worker');

export function createAuditFastWorker(): Worker {
  return new Worker<AuditJobData>(
    QUEUES.AUDIT_FAST,
    async (job: Job<AuditJobData>) => {
      const { auditId, contractCode, contractName, chain, plan, ercStandards } = job.data;
      const start = Date.now();
      log.info({ auditId, plan }, 'audit fast job started');

      // ── Mark DB record as processing ──────────────────────────────────────
      await prisma.audit.update({
        where: { id: auditId },
        data:  { status: 'PROCESSING' },
      });

      await prisma.auditJob.updateMany({
        where: { jobId: job.id! },
        data:  { status: 'processing', startedAt: new Date(), attempts: job.attemptsMade },
      });

      try {
        // ── Phase 1: deterministic tools in parallel ───────────────────────
        // Slither availability check is fast (3s timeout) — skip the full
        // Slither run early rather than waiting 120s for a timeout.
        const slitherUp = await isSlitherAvailable();
        if (!slitherUp) {
          log.warn({ auditId }, 'Slither sidecar unavailable — falling back to AST + Groq');
        }

        // All analysis runs in parallel: deterministic tools + LLM agents simultaneously.
        // Agent pipeline (Groq×8 + Gemini×2) and deterministic tools (Slither, Semgrep, AST)
        // race each other. First to finish doesn't block the others.
        const analysisPromises = [
          runAgentPipeline(contractCode, contractName, plan, ercStandards),
          runASTAnalysis(contractCode),
          runSemgrepAnalysis(contractCode, contractName),
          ...(slitherUp ? [runSlitherAnalysis(contractCode, contractName)] : []),
        ] as const;

        const [agentResult, astResult, semgrepResult, slitherResult] =
          await Promise.allSettled(analysisPromises);

        const rawFindings: RawFinding[] = [
          ...(agentResult.status   === 'fulfilled' ? agentResult.value.findings : []),
          ...(astResult.status     === 'fulfilled' ? astResult.value            : []),
          ...(semgrepResult.status === 'fulfilled' ? semgrepResult.value        : []),
          ...(slitherResult?.status === 'fulfilled' ? slitherResult.value       : []),
        ];

        if (agentResult.status === 'rejected') {
          log.warn({ auditId, err: agentResult.reason }, 'Agent pipeline partially failed');
        } else {
          log.info({
            auditId,
            groqAgents:   agentResult.value.groqAgentsRan,
            geminiAgents: agentResult.value.geminiAgentsRan,
            agentMs:      agentResult.value.durationMs,
          }, 'Agent pipeline summary');
        }
        if (semgrepResult.status === 'rejected') {
          log.warn({ auditId, err: semgrepResult.reason }, 'Semgrep partially failed');
        }
        if (slitherResult?.status === 'rejected') {
          log.warn({ auditId, err: slitherResult.reason }, 'Slither partially failed');
        }

        // ── Phase 2: v4 analysis-core — normalize → correlate → confidence ─
        // Single canonical pipeline (replaces the three v3 service copies).
        // Detector slugs resolve to canonical categories + calibrated TPRs;
        // union-find collapses cross-tool overlap; confidence is Bayesian with
        // the structural AI ceiling and proven-exploit floor enforced in code.
        const detections: RawDetection[] = rawFindings.map((f) => ({
          tool:         f.tool,
          detectorName: f.detectorName ?? f.agentName,
          agentName:    f.agentName,
          type:         f.type,
          severity:     f.severity,
          file:         f.file,
          lineStart:    f.lineStart,
          lineEnd:      f.lineEnd,
          description:  f.description,
          codeSnippet:  f.codeSnippet,
          swcId:        f.swcId,
        }));

        const findings: FindingV4[] = scoreAll(
          correlate(normalize(detections, { swcToCwe: swcToCweIds })),
        );

        // ── Phase 3: persist findings with full v4 scoring ────────────────
        if (findings.length > 0) {
          await prisma.finding.createMany({
            data: findings.map((f) => ({
              auditId,
              agentType:      mapAgentType(f.detectors[0]?.tool ?? 'ast') as AgentType,
              title:          f.type,
              description:    f.codeSnippet || f.type,
              severity:       f.severity.toUpperCase() as any,
              lineNumber:     f.lineStart,
              codeSnippet:    f.codeSnippet,
              recommendation: null,
              fingerprint:    f.fingerprint,
              confidence:     f.confidence,
              confirmedBy:    f.confirmedBy,
              category:       f.category,
              swcId:          f.swcId,
              cweIds:         f.cweIds,
              exploitability: f.exploitability,
              detectors:      f.detectors as unknown as Prisma.InputJsonValue,
              evidence:       f.evidence as unknown as Prisma.InputJsonValue,
            })),
            skipDuplicates: true,
          });
        }

        // ── Phase 4: update audit status & enqueue AI pass ─────────────────
        await prisma.audit.update({
          where: { id: auditId },
          data:  {
            status: 'DETERMINISTIC_COMPLETE' as any,
            score:  computeAggregateScore(findings),
          },
        });

        // Enqueue AI enhancement (non-blocking — fast path is complete).
        // findingIds are fingerprints, now persisted on Finding so the AI
        // worker can join enhancements back deterministically.
        const aiJobData: AIEnhancementJobData = {
          auditId,
          findingIds:   findings.map((f) => f.fingerprint),
          contractCode,
          plan,
        };
        await addToQueue(QUEUES.AI_ENHANCEMENT, aiJobData, {
          priority: job.data.priority,
          jobId:    `ai:${auditId}`, // idempotency
        });

        // ── Mark job complete ──────────────────────────────────────────────
        await prisma.auditJob.updateMany({
          where: { jobId: job.id! },
          data:  { status: 'completed', completedAt: new Date() },
        });

        const duration = Date.now() - start;
        metrics.queueJobsTotal.inc({ queue: QUEUES.AUDIT_FAST, status: 'completed' });
        metrics.queueJobDuration.observe({ queue: QUEUES.AUDIT_FAST }, duration / 1000);
        log.info({ auditId, duration, findings: findings.length }, 'audit fast job complete');

        return { auditId, findingCount: findings.length, duration };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ auditId, err: msg }, 'audit fast job failed');

        await prisma.audit.update({
          where: { id: auditId },
          data:  { status: 'FAILED', summary: 'Deterministic analysis failed.' },
        });
        await prisma.auditJob.updateMany({
          where: { jobId: job.id! },
          data:  { status: 'failed', lastError: msg },
        });

        metrics.queueJobsTotal.inc({ queue: QUEUES.AUDIT_FAST, status: 'failed' });
        throw err; // Let BullMQ retry
      }
    },
    {
      connection:  redisConnection,
      concurrency: QUEUE_CONCURRENCY[QUEUES.AUDIT_FAST],
    }
  );
}

// ── Helper: aggregate risk score ──────────────────────────────────────────────
function computeAggregateScore(findings: Array<{ severity: string }>): number {
  const WEIGHTS: Record<string, number> = { critical: 25, high: 12, medium: 5, low: 2, info: 0 };
  const raw = findings.reduce((sum, f) => sum + (WEIGHTS[f.severity] ?? 0), 0);
  return Math.min(100, raw);
}

function mapAgentType(tool: string): string {
  const map: Record<string, string> = {
    slither:  'SLITHER_AGENT',
    mythril:  'SECURITY',
    semgrep:  'SECURITY',
    ast:      'SECURITY',
    echidna:  'SECURITY',
    ai:       'CLAUDE_AGENT',
    groq:     'SECURITY',
  };
  return map[tool] ?? 'SECURITY';
}
