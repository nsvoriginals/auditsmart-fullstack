// packages/db/src/repositories/knowledge-base.repository.ts
// pgvector similarity search + exploit KB ingestion.
// All raw SQL is isolated here — no other file uses $queryRaw.
import { prisma }                    from '../client';
import type { VulnerabilityKnowledgeBase } from '@prisma/client';

export interface KbSearchResult {
  id:            string;
  name:          string;
  protocol:      string | null;
  amountLostUsd: number | null;
  swcIds:        string[];
  category:      string;
  description:   string;
  exploitTx:     string | null;
  fixPattern:    string | null;
  similarity:    number;
  date:          Date | null;
}

export interface UpsertKbInput {
  name:          string;
  protocol?:     string | null;
  date?:         Date | null;
  amountLostUsd?: number | null;
  swcIds:        string[];
  category:      string;
  severity:      string;
  chain:         string;
  codePattern:   string;
  description:   string;
  exploitTx?:    string | null;
  fixPattern?:   string | null;
  sourceUrl?:    string | null;
}

export const KnowledgeBaseRepository = {

  async upsert(input: UpsertKbInput): Promise<string> {
    const record = await prisma.vulnerabilityKnowledgeBase.upsert({
      where:  { name: input.name } as any,
      create: {
        name:          input.name,
        protocol:      input.protocol ?? null,
        date:          input.date ?? null,
        amountLostUsd: input.amountLostUsd != null ? BigInt(Math.round(input.amountLostUsd)) : null,
        swcIds:        input.swcIds,
        category:      input.category,
        severity:      input.severity,
        chain:         input.chain,
        codePattern:   input.codePattern,
        description:   input.description,
        exploitTx:     input.exploitTx ?? null,
        fixPattern:    input.fixPattern ?? null,
        sourceUrl:     input.sourceUrl ?? null,
      },
      update: {
        description: input.description,
        fixPattern:  input.fixPattern ?? null,
        updatedAt:   new Date(),
      },
    });
    return record.id;
  },

  async setEmbedding(id: string, embedding: number[]): Promise<void> {
    const vector = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`
      UPDATE vulnerability_knowledge_base
      SET    embedding  = ${vector}::vector,
             "embeddingAt" = NOW()
      WHERE  id = ${id}
    `;
  },

  async similaritySearch(
    queryEmbedding: number[],
    limit:          number = 5,
    minSimilarity:  number = 0.70,
  ): Promise<KbSearchResult[]> {
    const vector = `[${queryEmbedding.join(',')}]`;

    const rows = await prisma.$queryRaw<Array<KbSearchResult & { similarity: number }>>`
      SELECT
        id,
        name,
        protocol,
        ("amountLostUsd")::float8 AS "amountLostUsd",
        "swcIds",
        category,
        description,
        "exploitTx",
        "fixPattern",
        date,
        1 - (embedding <=> ${vector}::vector) AS similarity
      FROM vulnerability_knowledge_base
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${vector}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit}
    `;

    return rows;
  },

  async findById(id: string): Promise<VulnerabilityKnowledgeBase | null> {
    return prisma.vulnerabilityKnowledgeBase.findUnique({ where: { id } });
  },

  async countWithEmbeddings(): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM vulnerability_knowledge_base WHERE embedding IS NOT NULL
    `;
    return Number(result[0].count);
  },

} as const;
