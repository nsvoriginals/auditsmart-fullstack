-- prisma/migrations/20260524_pgvector_setup.sql
-- Run AFTER prisma migrate deploy via: psql $DATABASE_URL -f this_file.sql
-- Or include in your CI pipeline after migrations.

-- 1. Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add the embedding column to vulnerability_knowledge_base
ALTER TABLE vulnerability_knowledge_base
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. HNSW index — better than ivfflat for < 100k vectors (no training required)
--    m = 16: max edges per node  |  ef_construction = 64: build-time quality
CREATE INDEX IF NOT EXISTS vuln_kb_embedding_hnsw
  ON vulnerability_knowledge_base
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Add embedding column to the cache table
ALTER TABLE embedding_cache
  ADD COLUMN IF NOT EXISTS cached_embedding vector(1536);

CREATE INDEX IF NOT EXISTS embedding_cache_hnsw
  ON embedding_cache
  USING hnsw (cached_embedding vector_cosine_ops)
  WITH (m = 8, ef_construction = 32);

-- 5. Row-Level Security: each tenant can only read/write their own audits
ALTER TABLE "Audit"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Policy: application role sets app.current_user_id at session start
CREATE POLICY audit_tenant_isolation ON "Audit"
  USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY finding_tenant_isolation ON "Finding"
  USING (
    "auditId" IN (
      SELECT id FROM "Audit"
      WHERE "userId" = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY payment_tenant_isolation ON "Payment"
  USING ("userId" = current_setting('app.current_user_id', true));

-- Worker role bypasses RLS (it acts as superuser for background jobs)
-- Create a dedicated DB role for the worker:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'auditsmart_worker') THEN
    CREATE ROLE auditsmart_worker LOGIN PASSWORD 'CHANGE_ME_IN_PROD';
  END IF;
END$$;

GRANT SELECT, INSERT, UPDATE ON vulnerability_knowledge_base TO auditsmart_worker;
GRANT SELECT, INSERT, UPDATE ON "Audit" TO auditsmart_worker;
GRANT SELECT, INSERT, UPDATE ON "Finding" TO auditsmart_worker;
GRANT SELECT, INSERT, UPDATE ON audit_jobs TO auditsmart_worker;
GRANT SELECT, INSERT, UPDATE ON finding_enhancements TO auditsmart_worker;
GRANT SELECT, INSERT, UPDATE ON embedding_cache TO auditsmart_worker;
ALTER TABLE vulnerability_knowledge_base FORCE ROW LEVEL SECURITY;
ALTER ROLE auditsmart_worker BYPASSRLS;

-- 6. Helpful view for similarity search results
CREATE OR REPLACE VIEW v_exploit_similarity AS
SELECT
  id,
  name,
  protocol,
  date,
  amount_lost_usd,
  swc_ids,
  category,
  severity,
  chain,
  description,
  exploit_tx,
  fix_pattern,
  source_url,
  embedding IS NOT NULL AS has_embedding,
  created_at
FROM vulnerability_knowledge_base;
