// services/worker/src/index.ts
import { childLogger } from './lib/logger';
import { startMetricsServer } from './lib/metrics';
import { redisConnection } from './lib/redis';
import { prisma } from './lib/db';
import { addToQueue } from './lib/queues';
import { QUEUES, AuditJobData } from '@auditsmart/shared';
import { createAuditFastWorker } from './workers/audit.worker';
import { createAIWorker } from './workers/ai.worker';
import { createEmbeddingWorker } from './workers/embedding.worker';
import { createExploitIngestWorker } from './workers/exploit-ingest.worker';
import { createWebhookWorker } from './workers/webhook.worker';

const log = childLogger('worker-main');

// ── Boot all workers ──────────────────────────────────────────────────────────
const workers = [
  createAuditFastWorker(),
  createAIWorker(),
  createEmbeddingWorker(),
  createExploitIngestWorker(),
  createWebhookWorker(),
];

log.info({ workers: workers.map((w) => w.name) }, 'workers registered');

// ── Metrics HTTP server ───────────────────────────────────────────────────────
startMetricsServer(parseInt(process.env.METRICS_PORT ?? '9090', 10));

// ── Stuck-job recovery ────────────────────────────────────────────────────────
// Jobs can get stuck if the worker process was killed while processing.
// This cron runs every 5 minutes and re-enqueues audits that have been
// in PROCESSING status for more than 10 minutes.
const STUCK_JOB_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const RECOVERY_INTERVAL_MS   = 5 * 60 * 1000;  // 5 minutes

async function recoverStuckAudits(): Promise<void> {
  const cutoff = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS);

  const stuckAudits = await prisma.audit.findMany({
    where: {
      status:    'PROCESSING',
      updatedAt: { lt: cutoff },
    },
    select: {
      id:           true,
      contractCode: true,
      contractName: true,
      chain:        true,
    },
    take: 10, // process at most 10 per cycle to avoid queue flooding
  });

  if (stuckAudits.length === 0) return;

  log.warn({ count: stuckAudits.length }, 'recovering stuck audits');

  await Promise.allSettled(
    stuckAudits.map(async (audit) => {
      try {
        // Reset to QUEUED so the UI shows pending, then re-enqueue
        await prisma.audit.update({
          where: { id: audit.id },
          data:  { status: 'QUEUED' as any },
        });

        const jobData: AuditJobData = {
          auditId:      audit.id,
          contractCode: audit.contractCode ?? '',
          contractName: audit.contractName,
          chain:        audit.chain as any,
          plan:         'free',    // conservative default — audit worker will read actual plan from DB
          ercStandards: [],
          priority:     5,
        };

        await addToQueue(QUEUES.AUDIT_FAST, jobData, {
          jobId: `audit:${audit.id}:recovery`,
        });

        log.info({ auditId: audit.id }, 'stuck audit re-enqueued');
      } catch (err) {
        log.error({ auditId: audit.id, err }, 'failed to recover stuck audit');
      }
    })
  );
}

// Start the recovery loop
const recoveryInterval = setInterval(() => {
  recoverStuckAudits().catch((err) =>
    log.error({ err }, 'stuck-job recovery cycle failed')
  );
}, RECOVERY_INTERVAL_MS);

// Run immediately on startup
recoverStuckAudits().catch((err) =>
  log.error({ err }, 'initial stuck-job recovery failed')
);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  log.info({ signal }, 'shutdown initiated');

  clearInterval(recoveryInterval);

  // Close all workers (waits for in-flight jobs to finish)
  await Promise.allSettled(workers.map((w) => w.close()));

  // Close Redis and Prisma connections
  await Promise.allSettled([
    redisConnection.quit(),
    prisma.$disconnect(),
  ]);

  log.info('shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'uncaught exception — shutting down');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  log.fatal({ reason }, 'unhandled rejection — shutting down');
  shutdown('unhandledRejection');
});
