// services/worker/src/workers/webhook.worker.ts
import { Worker, Job } from 'bullmq';
import { createHmac, timingSafeEqual } from 'crypto';
import { QUEUES, QUEUE_CONCURRENCY, WebhookJobData } from '@auditsmart/shared';
import { redisConnection } from '../lib/redis';
import { prisma } from '../lib/db';
import { childLogger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const log = childLogger('webhook-worker');

const MAX_DELIVERY_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours — drop stale deliveries

export function createWebhookWorker(): Worker {
  return new Worker<WebhookJobData>(
    QUEUES.WEBHOOK_DELIVER,
    async (job: Job<WebhookJobData>) => {
      const { webhookId, auditId, event, payload } = job.data;

      // Skip deliveries older than 24 h (user has already moved on)
      const age = Date.now() - new Date(payload.timestamp ?? 0).getTime();
      if (age > MAX_DELIVERY_AGE_MS) {
        log.warn({ webhookId, auditId, age }, 'dropping stale webhook delivery');
        return;
      }

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook || !webhook.active) {
        log.info({ webhookId }, 'webhook not found or inactive — skipping');
        return;
      }

      const body      = JSON.stringify({ event, ...payload });
      const signature = signPayload(body, webhook.secret);

      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 15_000);

      try {
        const resp = await fetch(webhook.url, {
          method:  'POST',
          headers: {
            'Content-Type':       'application/json',
            'X-AuditSmart-Event': event,
            'X-AuditSmart-Sig':   signature,
            'User-Agent':         'AuditSmart-Webhook/1.0',
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!resp.ok) {
          throw new Error(`endpoint returned ${resp.status} ${resp.statusText}`);
        }

        await prisma.webhookDelivery.create({
          data: {
            webhookId,
            event,
            statusCode: resp.status,
            success:    true,
            attempt:    job.attemptsMade + 1,
          },
        });

        metrics.queueJobsTotal.inc({ queue: QUEUES.WEBHOOK_DELIVER, status: 'completed' });
        log.info({ webhookId, auditId, status: resp.status }, 'webhook delivered');
      } catch (err) {
        clearTimeout(timeout);

        const msg = err instanceof Error ? err.message : String(err);
        log.warn({ webhookId, auditId, attempt: job.attemptsMade + 1, err: msg }, 'webhook delivery failed');

        await prisma.webhookDelivery.create({
          data: {
            webhookId,
            event,
            statusCode: 0,
            success:    false,
            attempt:    job.attemptsMade + 1,
            error:      msg,
          },
        });

        metrics.queueJobsTotal.inc({ queue: QUEUES.WEBHOOK_DELIVER, status: 'failed' });
        throw err; // BullMQ will retry with exponential backoff
      }
    },
    {
      connection:  redisConnection,
      concurrency: QUEUE_CONCURRENCY[QUEUES.WEBHOOK_DELIVER],
    }
  );
}

function signPayload(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
}
