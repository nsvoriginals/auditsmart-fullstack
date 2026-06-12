// lib/queue/producer.ts
//
// API-side BullMQ producer. The Next.js API ONLY enqueues jobs — the worker
// service (services/worker) is the sole consumer. This is the single bridge
// between the serverless API and the durable queue.
//
// Requires REDIS_URL to be a TCP Redis connection string (redis:// or rediss://).
// NOTE: this is NOT the same as UPSTASH_REDIS_REST_URL (which is the REST API
// used by @upstash/ratelimit). BullMQ needs a real TCP connection.
import { Queue } from "bullmq";
import IORedis from "ioredis";
import {
  QUEUES,
  DEFAULT_JOB_OPTIONS,
  type QueueName,
  type AuditJobData,
} from "@auditsmart/shared";

const REDIS_URL = process.env.REDIS_URL;

// Reuse one connection + queue map across warm serverless invocations so we
// don't open a new socket on every request.
const g = globalThis as unknown as {
  __auditRedis?: IORedis;
  __auditQueues?: Map<QueueName, Queue>;
};

function getConnection(): IORedis {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL is not set — cannot enqueue audit jobs");
  }
  if (!g.__auditRedis) {
    // ioredis auto-enables TLS for rediss:// URLs.
    g.__auditRedis = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false, // required by BullMQ
    });
  }
  return g.__auditRedis;
}

function getQueue(name: QueueName): Queue {
  if (!g.__auditQueues) g.__auditQueues = new Map();
  if (!g.__auditQueues.has(name)) {
    g.__auditQueues.set(
      name,
      new Queue(name, {
        connection: getConnection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })
    );
  }
  return g.__auditQueues.get(name)!;
}

/**
 * Enqueue an audit for deterministic analysis.
 * jobId is derived from auditId so a double-submit (or a retry that re-enqueues)
 * is deduplicated by BullMQ rather than running the audit twice.
 */
export async function enqueueAudit(data: AuditJobData): Promise<string> {
  const job = await getQueue(QUEUES.AUDIT_FAST).add(QUEUES.AUDIT_FAST, data, {
    jobId: `audit:${data.auditId}`,
  });
  return job.id!;
}

export { QUEUES };
