-- v4 analysis-core scoring persistence on Finding.
-- Adds the deterministic scoring/classification columns that the pipeline
-- previously computed and then discarded, plus the (auditId, fingerprint)
-- uniqueness that makes re-runs idempotent and lets enhancements join by
-- fingerprint. Hand-authored DDL (matches the updated Prisma Finding model).

ALTER TABLE "Finding"
  ADD COLUMN IF NOT EXISTS "fingerprint"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "confidence"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "confirmedBy"    INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "category"       TEXT,
  ADD COLUMN IF NOT EXISTS "swcId"          TEXT,
  ADD COLUMN IF NOT EXISTS "cweIds"         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "exploitability" TEXT NOT NULL DEFAULT 'theoretical',
  ADD COLUMN IF NOT EXISTS "detectors"      JSONB,
  ADD COLUMN IF NOT EXISTS "evidence"       JSONB;

-- Backfill existing rows with a unique, non-empty fingerprint so the unique
-- index below does not collide on the '' default.
UPDATE "Finding" SET "fingerprint" = "id" WHERE "fingerprint" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "Finding_auditId_fingerprint_key"
  ON "Finding" ("auditId", "fingerprint");

CREATE INDEX IF NOT EXISTS "Finding_category_idx"
  ON "Finding" ("category");
