// packages/embeddings/src/providers/local.ts
// Uses @xenova/transformers — runs entirely in-process, no external calls.
// The first call downloads the model (~90MB) and caches it in ~/.cache/huggingface.
// Subsequent calls are instant.
//
// NOTE: This provider outputs 384-dimensional vectors.
// We project them to 1536 dims by repeating 4× to maintain schema compatibility.
// In production, prefer the OpenAI provider for accuracy.

import { EmbeddingProvider, EMBEDDING_DIMS } from '../interface';

let pipelineInstance: any = null;

async function getPipeline() {
  if (!pipelineInstance) {
    // Dynamic import so servers without the package don't crash
    const { pipeline } = await import('@xenova/transformers' as any);
    pipelineInstance = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',   // 384 dims, 80MB, fast
    );
  }
  return pipelineInstance;
}

/** Project 384-dim vector → 1536 by tiling. */
function project384to1536(v: number[]): number[] {
  const result: number[] = new Array(EMBEDDING_DIMS);
  for (let i = 0; i < EMBEDDING_DIMS; i++) {
    result[i] = v[i % v.length];
  }
  // Re-normalize after tiling
  const norm = Math.sqrt(result.reduce((s, x) => s + x * x, 0));
  return result.map(x => x / (norm || 1));
}

export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'local-all-minilm-l6-v2';
  readonly dims = EMBEDDING_DIMS;

  async generate(text: string): Promise<number[]> {
    const [result] = await this.generateBatch([text]);
    return result;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    const pipe = await getPipeline();
    const results: number[][] = [];

    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      const raw = Array.from(output.data as Float32Array);
      results.push(project384to1536(raw));
    }

    return results;
  }
}
