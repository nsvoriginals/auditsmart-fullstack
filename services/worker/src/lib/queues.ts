// services/worker/src/lib/queues.ts
import { Queue, JobsOptions } from 'bullmq';
import { QUEUES, QueueName, DEFAULT_JOB_OPTIONS } from '@auditsmart/shared';
import { redisConnection } from './redis';

// Instantiate all queues once — share across workers and the API service.
const queueInstances = new Map<QueueName, Queue>();

function getQueue(name: QueueName): Queue {
  if (!queueInstances.has(name)) {
    queueInstances.set(
      name,
      new Queue(name, {
        connection:   redisConnection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })
    );
  }
  return queueInstances.get(name)!;
}

export async function addToQueue<T>(
  queueName: QueueName,
  data: T,
  opts: JobsOptions & { jobId?: string } = {}
): Promise<string> {
  const queue = getQueue(queueName);
  const job   = await queue.add(queueName, data, {
    ...DEFAULT_JOB_OPTIONS,
    ...opts,
  });
  return job.id!;
}

export async function getQueueStats(queueName: QueueName) {
  const queue = getQueue(queueName);
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

export { getQueue };
export const allQueues = Object.values(QUEUES).map(getQueue);
