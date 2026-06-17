// services/worker/src/lib/metrics.ts
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import http from 'http';
import { childLogger } from './logger';

const log = childLogger('metrics');

export const register = new Registry();
register.setDefaultLabels({ service: 'auditsmart-worker' });
collectDefaultMetrics({ register });

// ── Queue metrics ─────────────────────────────────────────────────────────────
export const queueJobsTotal = new Counter({
  name:       'bullmq_jobs_total',
  help:       'Total BullMQ jobs processed',
  labelNames: ['queue', 'status'] as const,
  registers:  [register],
});

export const queueJobDuration = new Histogram({
  name:       'bullmq_job_duration_seconds',
  help:       'BullMQ job processing duration',
  labelNames: ['queue'] as const,
  buckets:    [1, 5, 15, 30, 60, 120, 300],
  registers:  [register],
});

export const queueDepth = new Gauge({
  name:       'bullmq_queue_depth',
  help:       'Approximate number of waiting jobs per queue',
  labelNames: ['queue'] as const,
  registers:  [register],
});

// ── AI / embedding metrics ────────────────────────────────────────────────────
export const aiLatency = new Histogram({
  name:    'ai_request_duration_seconds',
  help:    'Claude API call duration',
  buckets: [1, 5, 15, 30, 60, 90, 120],
  registers: [register],
});

export const aiErrors = new Counter({
  name:       'ai_errors_total',
  help:       'Claude API errors',
  labelNames: ['reason'] as const,
  registers:  [register],
});

export const aiEnhancementsTotal = new Counter({
  name:    'ai_enhancements_total',
  help:    'Total finding enhancements written',
  registers: [register],
});

export const embeddingLatency = new Histogram({
  name:    'embedding_generation_duration_seconds',
  help:    'Embedding API call duration',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const similaritySearchLatency = new Histogram({
  name:    'similarity_search_duration_seconds',
  help:    'pgvector cosine similarity search duration',
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const similarityCacheHits = new Counter({
  name:    'similarity_cache_hits_total',
  help:    'Similarity search Redis cache hits',
  registers: [register],
});

export const similarityCacheMisses = new Counter({
  name:    'similarity_cache_misses_total',
  help:    'Similarity search Redis cache misses',
  registers: [register],
});

// ── Finding metrics ───────────────────────────────────────────────────────────
export const findingsTotal = new Counter({
  name:       'findings_total',
  help:       'Total findings persisted',
  labelNames: ['severity', 'source'] as const,
  registers:  [register],
});

export const auditStuckRecovered = new Counter({
  name:    'audit_stuck_recovered_total',
  help:    'Stuck audits re-enqueued by recovery job',
  registers: [register],
});

// ── Security metrics ────────────────────────────────────────────────────────
export const promptInjectionTotal = new Counter({
  name:       'prompt_injection_detected_total',
  help:       'Prompt-injection attempts detected in untrusted contract source',
  labelNames: ['severity'] as const,
  registers:  [register],
});

export const metrics = {
  queueJobsTotal,
  queueJobDuration,
  queueDepth,
  aiLatency,
  aiErrors,
  aiEnhancementsTotal,
  embeddingLatency,
  similaritySearchLatency,
  similarityCacheHits,
  similarityCacheMisses,
  findingsTotal,
  auditStuckRecovered,
  promptInjectionTotal,
};

// ── HTTP server to expose /metrics for Prometheus scraping ───────────────────
export function startMetricsServer(port = 9090): void {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics' && req.method === 'GET') {
      try {
        res.writeHead(200, { 'Content-Type': register.contentType });
        res.end(await register.metrics());
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    log.info({ port }, 'metrics server started');
  });
}
