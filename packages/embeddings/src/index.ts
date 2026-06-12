// packages/embeddings/src/index.ts
export * from './interface';
export { OpenAIEmbeddingProvider } from './providers/openai';
export { LocalEmbeddingProvider } from './providers/local';

import { EmbeddingProvider } from './interface';
import { OpenAIEmbeddingProvider } from './providers/openai';
import { LocalEmbeddingProvider } from './providers/local';

/**
 * Returns the appropriate provider based on environment.
 * OpenAI is preferred; falls back to local when OPENAI_API_KEY is absent.
 */
export function createEmbeddingProvider(): EmbeddingProvider {
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    return new OpenAIEmbeddingProvider(key);
  }
  console.warn('[embeddings] OPENAI_API_KEY not set — using local embedding model (lower accuracy)');
  return new LocalEmbeddingProvider();
}
