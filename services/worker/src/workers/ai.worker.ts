// services/worker/src/workers/ai.worker.ts
import { Worker, Job } from 'bullmq';
import { QUEUES, QUEUE_CONCURRENCY, AIEnhancementJobData, NormalizedFinding, VulnerabilityCategory, ToolDetection } from '@auditsmart/shared';
import { redisConnection } from '../lib/redis';
import { prisma } from '../lib/db';
import { KnowledgeBaseRepository } from '../repositories/knowledge-base.repository';
import { SimilarityService } from '../services/similarity.service';
import { runAICorrelationPass } from '../services/ai-pass';
import { childLogger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const log = childLogger('ai-worker');

const kb         = new KnowledgeBaseRepository(prisma);
const similarity = new SimilarityService(kb);

export function createAIWorker(): Worker {
  return new Worker<AIEnhancementJobData>(
    QUEUES.AI_ENHANCEMENT,
    async (job: Job<AIEnhancementJobData>) => {
      const { auditId, contractCode, plan } = job.data;
      const start = Date.now();
      log.info({ auditId, plan }, 'AI enhancement job started');

      // Load the deterministic findings (with full v4 scoring) from the DB.
      const dbFindings = await prisma.finding.findMany({
        where:  { auditId },
        select: {
          id: true, title: true, description: true,
          severity: true, lineNumber: true, codeSnippet: true,
          fingerprint: true, confidence: true, confirmedBy: true,
          category: true, swcId: true, cweIds: true, detectors: true,
        },
      });

      if (dbFindings.length === 0) {
        log.info({ auditId }, 'No findings to enhance — AI pass skipped');
        await finalizeAudit(auditId);
        return;
      }

      // Re-hydrate into NormalizedFinding using the REAL persisted scoring —
      // fingerprint, category, swc, detectors — so enhancements join back
      // deterministically and the prompt carries accurate evidence.
      const findings: NormalizedFinding[] = dbFindings.map((f) => ({
        id:          f.id,
        fingerprint: f.fingerprint || f.id,
        file:        'Contract.sol',
        lineStart:   f.lineNumber ?? 0,
        lineEnd:     (f.lineNumber ?? 0) + 5,
        codeSnippet: (f.codeSnippet ?? f.description ?? '').slice(0, 500),
        type:        f.title,
        swcId:       f.swcId ?? 'SWC-000',
        cweIds:      f.cweIds ?? [],
        category:    (f.category ?? 'other') as VulnerabilityCategory,
        severity:    f.severity.toLowerCase() as any,
        confidence:  f.confidence ?? 0,
        confirmedBy: f.confirmedBy ?? 1,
        detectors:   Array.isArray(f.detectors)
          ? (f.detectors as unknown as ToolDetection[])
          : [{ tool: 'ai', detectorName: 'unknown' }],
      }));

      try {
        await runAICorrelationPass(auditId, findings, contractCode, plan, similarity);
        await finalizeAudit(auditId);

        metrics.queueJobsTotal.inc({ queue: QUEUES.AI_ENHANCEMENT, status: 'completed' });
        metrics.queueJobDuration.observe({ queue: QUEUES.AI_ENHANCEMENT }, (Date.now() - start) / 1000);
        log.info({ auditId, duration: Date.now() - start }, 'AI enhancement complete');
      } catch (err) {
        log.error({ auditId, err }, 'AI enhancement failed');
        // Do not fail the audit — AI is optional
        await finalizeAudit(auditId);
        metrics.queueJobsTotal.inc({ queue: QUEUES.AI_ENHANCEMENT, status: 'failed' });
      }
    },
    {
      connection:  redisConnection,
      concurrency: QUEUE_CONCURRENCY[QUEUES.AI_ENHANCEMENT],
    }
  );
}

async function finalizeAudit(auditId: string): Promise<void> {
  // Re-compute score after AI pass (enhancements don't change score)
  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status:      'COMPLETED',
      completedAt: new Date(),
    },
  });
}
