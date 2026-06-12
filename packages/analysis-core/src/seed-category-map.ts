// packages/analysis-core/src/seed-category-map.ts
//
// Seeds the detector_category_map table from the in-code default table, so the
// DB overlay and the build-time defaults start identical. Idempotent: re-runs
// upsert. Intended to be invoked from a Prisma-aware context (the worker or a
// CLI), which passes in an upsert function — analysis-core stays Prisma-free.
import { defaultCategoryTable } from './category-map.js';

export interface SeedRow {
  tool: string;
  detectorName: string;
  category: string;
  swcId: string;
  tpr: number;
}

/** Flatten the in-code table into upsertable rows. */
export function categoryMapSeedRows(): SeedRow[] {
  const rows: SeedRow[] = [];
  for (const [key, mapping] of defaultCategoryTable()) {
    const sep = key.indexOf(':');
    const tool = key.slice(0, sep);
    const detectorName = key.slice(sep + 1);
    rows.push({ tool, detectorName, category: mapping.category, swcId: mapping.swcId, tpr: mapping.tpr });
  }
  return rows;
}

/**
 * Apply the seed via a caller-supplied upsert (keeps this package Prisma-free).
 *
 * @example
 *   await seedCategoryMap((r) => prisma.detectorCategoryMap.upsert({
 *     where: { tool_detectorName: { tool: r.tool, detectorName: r.detectorName } },
 *     create: r, update: { category: r.category, swcId: r.swcId, tpr: r.tpr },
 *   }));
 */
export async function seedCategoryMap(
  upsert: (row: SeedRow) => Promise<unknown>,
): Promise<number> {
  const rows = categoryMapSeedRows();
  for (const row of rows) await upsert(row);
  return rows.length;
}

/** Build the runtime overlay Map the engines consume, from DB rows. */
export function overlayFromRows(rows: SeedRow[]): Map<string, { category: any; swcId: string; tpr: number }> {
  const m = new Map<string, { category: any; swcId: string; tpr: number }>();
  for (const r of rows) {
    m.set(`${r.tool}:${r.detectorName.toLowerCase()}`, { category: r.category, swcId: r.swcId, tpr: r.tpr });
  }
  return m;
}
