// packages/embeddings/src/interface.ts

export const EMBEDDING_DIMS = 1536; // OpenAI text-embedding-3-small

export interface EmbeddingProvider {
  /** Returns a 1536-dimensional unit vector. */
  generate(text: string): Promise<number[]>;
  /** Batch generation — more cost-efficient than calling generate() N times. */
  generateBatch(texts: string[]): Promise<number[][]>;
  /** Identifier for cache-key namespacing */
  readonly name: string;
  /** Dimension of vectors produced */
  readonly dims: number;
}

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  model: string;
  durationMs: number;
}
