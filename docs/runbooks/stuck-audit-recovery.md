# Runbook: Stuck Audit Recovery

## Symptoms

- Audits remain in `PROCESSING` or `DETERMINISTIC_COMPLETE` for > 30 minutes
- BullMQ job count in queue drops to 0 but audit is still in-progress state
- Customer reports audit "spinning" in dashboard

## Root causes

1. Worker process crashed mid-job (OOM, uncaught exception)
2. Slither sidecar OOM-killed during analysis of a large contract
3. Redis connection lost during job processing
4. Prisma connection pool exhausted

## Automatic recovery

The worker runs `recoverStuckAudits()` every 5 minutes (cron in `services/worker/src/index.ts`).
It finds audits stuck in PROCESSING for > 20 minutes and re-enqueues them.

## Manual recovery

```bash
# 1. Find stuck audits
docker exec -it auditsmart-api-1 pnpm tsx scripts/find-stuck-audits.ts

# 2. Re-queue a specific audit
docker exec -it auditsmart-worker-1 pnpm tsx scripts/requeue-audit.ts <auditId>

# 3. Mark as failed if unrecoverable
docker exec -it auditsmart-api-1 pnpm tsx scripts/fail-audit.ts <auditId>
```

## Monitoring

Check `auditsmart_stuck_audits_total` Prometheus metric.
Alert fires when value > 0 for more than 10 minutes.

Grafana panel: "Stuck Audits" in the "Audit Pipeline" dashboard.

## Prevention

- Set `NODE_OPTIONS=--max-old-space-size=768` on the worker to prevent silent OOM
- Set Slither container memory limit to 1Gi in docker-compose.prod.yml
- Monitor `process_resident_memory_bytes` on both worker and slither containers
