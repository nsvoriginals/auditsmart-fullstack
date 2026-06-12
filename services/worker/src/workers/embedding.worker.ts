// services/worker/src/workers/embedding.worker.ts
import { Worker, Job } from 'bullmq';
import { QUEUES, QUEUE_CONCURRENCY, EmbeddingJobData } from '@auditsmart/shared';
import { createEmbeddingProvider } from '@auditsmart/embeddings';
import { redisConnection } from '../lib/redis';
import { KnowledgeBaseRepository } from '../repositories/knowledge-base.repository';
import { prisma } from '../lib/db';
import { childLogger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const log      = childLogger('embedding-worker');
const provider = createEmbeddingProvider();
const kb       = new KnowledgeBaseRepository(prisma);

export function createEmbeddingWorker(): Worker {
  return new Worker<EmbeddingJobData>(
    QUEUES.EMBEDDING,
    async (job: Job<EmbeddingJobData>) => {
      const { entityType, entityId, text } = job.data;
      const start = Date.now();

      log.debug({ entityType, entityId }, 'generating embedding');
      const embedding = await provider.generate(text);

      if (entityType === 'vulnerability_knowledge_base') {
        await kb.setEmbedding(entityId, embedding);
      }
      // Future: handle 'finding' entityType for per-finding similarity

      metrics.embeddingLatency.observe((Date.now() - start) / 1000);
      metrics.queueJobsTotal.inc({ queue: QUEUES.EMBEDDING, status: 'completed' });

      log.debug({ entityId, durationMs: Date.now() - start }, 'embedding stored');
    },
    {
      connection:  redisConnection,
      concurrency: QUEUE_CONCURRENCY[QUEUES.EMBEDDING],
    }
  );
}
