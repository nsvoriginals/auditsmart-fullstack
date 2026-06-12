// services/worker/src/services/similarity.service.ts
import crypto from 'crypto';
import { SimilarExploit } from '@auditsmart/shared';
import { createEmbeddingProvider, EmbeddingProvider } from '@auditsmart/embeddings';
import { KnowledgeBaseRepository } from '../repositories/knowledge-base.repository';
import { cacheRedis, CACHE_TTL } from '../lib/redis';
import { childLogger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const log = childLogger('similarity');

export class SimilarityService {
  private embeddingProvider: EmbeddingProvider;

  constructor(private readonly kb: KnowledgeBaseRepository) {
    this.embeddingProvider = createEmbeddingProvider();
  }

  /**
   * Core method: given a raw code snippet or description, find historically similar exploits.
   *
   * Flow:
   *  1. Hash the input text → check Redis cache
   *  2. If cache miss → generate embedding via OpenAI/local
   *  3. Run pgvector cosine similarity against KB
   *  4. Cache results
   *  5. Return ranked matches
   */
  async findSimilarExploits(
    codeSnippet: string,
    opts: {
      threshold?: number;
      limit?: number;
      category?: string;
      chain?: string;
      bypassCache?: boolean;
    } = {}
  ): Promise<SimilarExploit[]> {
    const { threshold = 0.78, limit = 5, bypassCache = false } = opts;

    const inputHash = this.hashText(codeSnippet);
    const cacheKey  = `similarity:${inputHash}:${threshold}:${limit}:${opts.category ?? '_'}:${opts.chain ?? '_'}`;

    // ── Cache read ──────────────────────────────────────────────────────────
    if (!bypassCache) {
      const cached = await cacheRedis.get(cacheKey);
      if (cached) {
        log.debug({ cacheKey }, 'similarity cache hit');
        metrics.similarityCacheHits.inc();
        return JSON.parse(cached) as SimilarExploit[];
      }
    }

    // ── Embedding generation ────────────────────────────────────────────────
    const embeddingStart = Date.now();

    // Check DB embedding cache first to avoid redundant API calls
    const cachedEmb = await this.kb.getCachedEmbedding(inputHash);
    let embedding: number[];

    if (cachedEmb) {
      embedding = cachedEmb;
      log.debug({ inputHash }, 'embedding db-cache hit');
    } else {
      embedding = await this.embeddingProvider.generate(codeSnippet);
      await this.kb.setCachedEmbedding(inputHash, this.embeddingProvider.name, embedding);
    }

    metrics.embeddingLatency.observe((Date.now() - embeddingStart) / 1000);

    // ── Vector search ───────────────────────────────────────────────────────
    const searchStart = Date.now();
    const results = await this.kb.findSimilar(embedding, {
      threshold,
      limit,
      category: opts.category,
      chain:    opts.chain,
    });
    metrics.similaritySearchLatency.observe((Date.now() - searchStart) / 1000);
    metrics.similarityCacheMisses.inc();

    // ── Cache write ─────────────────────────────────────────────────────────
    if (results.length > 0) {
      await cacheRedis.setex(cacheKey, CACHE_TTL.similaritySearch, JSON.stringify(results));
    }

    log.info({ count: results.length, topScore: results[0]?.similarity }, 'similarity search complete');
    return results;
  }

  /**
   * Enrich a batch of findings with historical exploit similarity.
   * Designed to be called in the AI enhancement pass.
   */
  async enrichFindings(
    findings: Array<{ fingerprint: string; codeSnippet: string; category?: string; swcId?: string }>
  ): Promise<Map<string, SimilarExploit[]>> {
    const enriched = new Map<string, SimilarExploit[]>();

    // Process in parallel with concurrency limit (avoid hammering OpenAI)
    const CONCURRENCY = 3;
    for (let i = 0; i < findings.length; i += CONCURRENCY) {
      const batch = findings.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (f) => {
          const similar = await this.findSimilarExploits(f.codeSnippet, {
            limit:    3,
            category: f.category,
          });
          enriched.set(f.fingerprint, similar);
        })
      );
    }

    return enriched;
  }

  private hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
