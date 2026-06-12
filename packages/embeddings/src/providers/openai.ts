// packages/embeddings/src/providers/openai.ts
import OpenAI from 'openai';
import { EmbeddingProvider, EMBEDDING_DIMS } from '../interface';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai-text-embedding-3-small';
  readonly dims = EMBEDDING_DIMS;

  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(text: string): Promise<number[]> {
    const [result] = await this.generateBatch([text]);
    return result;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // OpenAI allows up to 2048 inputs per request
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
        dimensions: EMBEDDING_DIMS, // text-embedding-3-small supports dimension reduction
      });

      // OpenAI returns embeddings in the same order as input
      const batchEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map(d => d.embedding);

      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }
}
