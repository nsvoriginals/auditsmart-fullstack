// services/worker/src/repositories/knowledge-base.repository.ts
import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { SimilarExploit, ExploitRecord } from '@auditsmart/shared';
import { logger } from '../lib/logger';

// ── Raw SQL row types (returned by $queryRaw) ─────────────────────────────────
interface KBRow {
  id: string;
  name: string;
  protocol: string | null;
  date: Date | null;
  amount_lost_usd: bigint | null;
  swc_ids: string[];
  category: string;
  description: string;
  exploit_tx: string | null;
  fix_pattern: string | null;
  similarity: number;
}

interface CacheRow {
  cached_embedding: string; // Postgres returns vectors as "[x,x,x,...]" strings
}

export class KnowledgeBaseRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Similarity search ──────────────────────────────────────────────────────
  async findSimilar(
    embedding: number[],
    opts: {
      threshold?: number;  // cosine similarity floor, default 0.78
      limit?: number;      // default 5
      category?: string;   // optional filter
      chain?: string;      // optional filter
    } = {}
  ): Promise<SimilarExploit[]> {
    const { threshold = 0.78, limit = 5, category, chain } = opts;
    const vectorLiteral = Prisma.raw(`'[${embedding.join(',')}]'::vector`);

    // Build optional WHERE clauses
    const categoryClause = category
      ? Prisma.raw(`AND category = '${category.replace(/'/g, "''")}'`)
      : Prisma.raw('');
    const chainClause = chain
      ? Prisma.raw(`AND chain = '${chain.replace(/'/g, "''")}'`)
      : Prisma.raw('');

    const rows = await this.db.$queryRaw<KBRow[]>(
      Prisma.sql`
        SELECT
          id, name, protocol, date,
          amount_lost_usd, swc_ids, category,
          description, exploit_tx, fix_pattern,
          1 - (embedding <=> ${vectorLiteral}) AS similarity
        FROM vulnerability_knowledge_base
        WHERE
          embedding IS NOT NULL
          AND 1 - (embedding <=> ${vectorLiteral}) > ${threshold}
          ${categoryClause}
          ${chainClause}
        ORDER BY embedding <=> ${vectorLiteral}
        LIMIT ${limit}
      `
    );

    return rows.map((r) => ({
      id:           r.id,
      name:         r.name,
      protocol:     r.protocol,
      amountLostUsd: r.amount_lost_usd !== null ? Number(r.amount_lost_usd) : null,
      swcIds:       r.swc_ids,
      description:  r.description,
      fixPattern:   r.fix_pattern,
      exploitTx:    r.exploit_tx,
      date:         r.date ? r.date.toISOString().slice(0, 10) : null,
      similarity:   Math.round(r.similarity * 10000) / 10000,
    }));
  }

  // ── Upsert an exploit record ───────────────────────────────────────────────
  async upsertExploit(record: ExploitRecord): Promise<{ id: string; isNew: boolean }> {
    // Dedup by (name + protocol) using upsert
    const existing = await this.db.vulnerabilityKnowledgeBase.findFirst({
      where: {
        name:     record.name,
        protocol: record.protocol ?? undefined,
      },
      select: { id: true },
    });

    if (existing) {
      await this.db.vulnerabilityKnowledgeBase.update({
        where: { id: existing.id },
        data:  this.recordToData(record),
      });
      return { id: existing.id, isNew: false };
    }

    const created = await this.db.vulnerabilityKnowledgeBase.create({
      data: { id: crypto.randomUUID(), ...this.recordToData(record) },
    });
    return { id: created.id, isNew: true };
  }

  // ── Store embedding vector for a KB entry ─────────────────────────────────
  async setEmbedding(id: string, embedding: number[]): Promise<void> {
    const vectorLiteral = Prisma.raw(`'[${embedding.join(',')}]'::vector`);
    await this.db.$executeRaw`
      UPDATE vulnerability_knowledge_base
      SET embedding = ${vectorLiteral}, embedding_at = NOW()
      WHERE id = ${id}
    `;
  }

  // ── Retrieve IDs that are missing embeddings ──────────────────────────────
  async findMissingEmbeddings(limit = 50): Promise<Array<{ id: string; text: string }>> {
    const rows = await this.db.vulnerabilityKnowledgeBase.findMany({
      where:  { embeddingAt: null },
      select: { id: true, name: true, description: true, codePattern: true },
      take:   limit,
    });

    return rows.map((r) => ({
      id:   r.id,
      text: this.buildEmbeddingText(r.name, r.description, r.codePattern),
    }));
  }

  // ── Embedding cache ───────────────────────────────────────────────────────
  async getCachedEmbedding(textHash: string): Promise<number[] | null> {
    const rows = await this.db.$queryRaw<CacheRow[]>(
      Prisma.sql`
        SELECT cached_embedding::text AS cached_embedding
        FROM embedding_cache
        WHERE text_hash = ${textHash}
        LIMIT 1
      `
    );

    if (rows.length === 0) return null;

    const raw = rows[0].cached_embedding;
    // Postgres returns vector as "[x1,x2,...]" string
    return JSON.parse(raw.replace(/^\[|\]$/g, '').split(',').map(Number).toString()
      .replace(/\[|\]/g, '').split(',').map(Number).join(',')
      .replace(/^/, '[').replace(/$/, ']')
    );
  }

  async setCachedEmbedding(
    textHash: string,
    model: string,
    embedding: number[]
  ): Promise<void> {
    const vectorLiteral = Prisma.raw(`'[${embedding.join(',')}]'::vector`);
    await this.db.$executeRaw`
      INSERT INTO embedding_cache (id, text_hash, model, cached_embedding, created_at)
      VALUES (${crypto.randomUUID()}, ${textHash}, ${model}, ${vectorLiteral}, NOW())
      ON CONFLICT (text_hash) DO NOTHING
    `;
  }

  async count(): Promise<number> {
    return this.db.vulnerabilityKnowledgeBase.count();
  }

  async countWithEmbeddings(): Promise<number> {
    const result = await this.db.$queryRaw<[{ c: bigint }]>`
      SELECT COUNT(*) AS c FROM vulnerability_knowledge_base WHERE embedding IS NOT NULL
    `;
    return Number(result[0].c);
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private recordToData(r: ExploitRecord) {
    return {
      name:          r.name,
      protocol:      r.protocol ?? null,
      date:          r.date ? new Date(r.date) : null,
      amountLostUsd: r.amountLostUsd !== null ? BigInt(r.amountLostUsd) : null,
      swcIds:        r.swcIds,
      category:      r.category,
      severity:      r.severity,
      chain:         r.chain,
      codePattern:   r.codePattern,
      description:   r.description,
      exploitTx:     r.exploitTx ?? null,
      fixPattern:    r.fixPattern ?? null,
      sourceUrl:     r.sourceUrl ?? null,
    };
  }

  private buildEmbeddingText(name: string, description: string, codePattern: string): string {
    // Combine the most semantically rich fields for embedding
    return [
      `Vulnerability: ${name}`,
      description,
      `Vulnerable code pattern:\n${codePattern}`,
    ].join('\n\n');
  }
}
