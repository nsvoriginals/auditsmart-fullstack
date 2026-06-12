-- docker/postgres/init.sql
-- Runs once when the PostgreSQL container is first initialised.

-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Optimise for vector workloads on a small instance
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET max_parallel_workers_per_gather = 0; -- single vCPU

SELECT pg_reload_conf();
