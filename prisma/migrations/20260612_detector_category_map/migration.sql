-- Phase 4: detector_category_map — runtime overlay for analysis-core.
-- Hand-authored DDL (matches Prisma model DetectorCategoryMap).
CREATE TABLE IF NOT EXISTS "detector_category_map" (
  "id"           TEXT NOT NULL,
  "tool"         TEXT NOT NULL,
  "detectorName" TEXT NOT NULL,
  "category"     TEXT NOT NULL,
  "swcId"        TEXT NOT NULL DEFAULT 'SWC-000',
  "tpr"          DOUBLE PRECISION NOT NULL,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "detector_category_map_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "detector_category_map_tpr_range" CHECK ("tpr" >= 0 AND "tpr" <= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS "detector_category_map_tool_detectorName_key"
  ON "detector_category_map" ("tool", "detectorName");

CREATE INDEX IF NOT EXISTS "detector_category_map_category_idx"
  ON "detector_category_map" ("category");
