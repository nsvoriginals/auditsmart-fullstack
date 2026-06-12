// packages/analyzer-sdk/src/loader.ts
// Dynamic analyzer plugin loader.
// New chains are added by dropping an Analyzer implementation into the
// registry — nothing else in the pipeline changes.
import type { Analyzer, AnalysisContext } from './types';

export interface AnalyzerRegistration {
  analyzer:    Analyzer;
  enabled:     boolean;
  /** Override the default timeout from AnalysisContext. */
  timeoutMs?:  number;
}

export class AnalyzerRegistry {
  private readonly analyzers = new Map<string, AnalyzerRegistration>();

  register(reg: AnalyzerRegistration): void {
    const id = reg.analyzer.metadata.id;
    if (this.analyzers.has(id)) {
      throw new Error(`Analyzer "${id}" is already registered`);
    }
    this.analyzers.set(id, reg);
  }

  get(id: string): AnalyzerRegistration | undefined {
    return this.analyzers.get(id);
  }

  /** All enabled analyzers for a given chain family. */
  forChain(chain: string): AnalyzerRegistration[] {
    const family = chainToFamily(chain);
    return Array.from(this.analyzers.values()).filter(
      (r) => r.enabled && r.analyzer.metadata.chain === family,
    );
  }

  /** Prepare all registered analyzers. Failures are logged but do not abort startup. */
  async prepareAll(context: AnalysisContext): Promise<void> {
    const preparations = Array.from(this.analyzers.values())
      .filter((r) => r.enabled)
      .map(async (r) => {
        const id = r.analyzer.metadata.id;
        try {
          await withTimeout(
            r.analyzer.prepare(context),
            5_000,
            `${id} prepare() timed out`,
          );
          context.logger.info({ analyzer: id }, 'Analyzer ready');
        } catch (err) {
          context.logger.warn(
            { analyzer: id, err: String(err) },
            'Analyzer prepare() failed — will be skipped for this session',
          );
          r.enabled = false;
        }
      });
    await Promise.allSettled(preparations);
  }

  async cleanupAll(): Promise<void> {
    const cleanups = Array.from(this.analyzers.values()).map(async (r) => {
      try {
        await r.analyzer.cleanup();
      } catch { /* best-effort */ }
    });
    await Promise.allSettled(cleanups);
  }
}

// ── Chain string → ChainFamily ────────────────────────────────────────────────

const EVM_CHAINS = new Set([
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'bnb',
  'avalanche', 'tron', 'linea', 'scroll', 'zksync', 'mantle', 'blast',
]);

export function chainToFamily(chain: string): string {
  const c = chain.toLowerCase();
  if (EVM_CHAINS.has(c))        return 'evm';
  if (c === 'solana' || c === 'svm') return 'solana';
  if (c === 'cosmwasm' || c.includes('cosmos')) return 'cosmwasm';
  if (c === 'ink' || c.includes('polkadot') || c.includes('substrate')) return 'ink';
  if (c === 'ton')              return 'ton';
  if (c === 'starknet')         return 'starknet';
  if (c === 'near')             return 'near';
  if (c === 'sui')              return 'sui';
  if (c === 'aptos')            return 'aptos';
  return 'evm'; // safe default — most contracts are EVM
}

// ── Utility ───────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}
