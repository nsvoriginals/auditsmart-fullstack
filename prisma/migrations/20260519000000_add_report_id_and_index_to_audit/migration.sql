-- Add reportId column for fast public-report lookups (replaces slow JSON CONTAINS scan)
ALTER TABLE "Audit" ADD COLUMN "reportId" TEXT;

-- Unique constraint + index: O(log n) lookup instead of full-table JSON search
CREATE UNIQUE INDEX "Audit_reportId_key" ON "Audit"("reportId");

-- Composite index for dashboard stats queries (userId + status filter used together)
CREATE INDEX "Audit_userId_status_idx" ON "Audit"("userId", "status");
