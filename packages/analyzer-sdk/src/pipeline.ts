// packages/analyzer-sdk/src/pipeline.ts
// Orchestrates all registered analyzers for a single audit job.
// This is the single place that runs analyzers in parallel, collects results,
// normalizes, deduplicates, and scores confidence.
import type { ContractInput, AnalysisContext, RawAnalyzerFinding } from './types';
import type { AnalyzerRegistry }                                    from './loader';
import type { NormalizedFinding }                                   from '@auditsmart/shared';
import { normalizeFindings }   from './normalizer';
import { correlateByLocation } from './correlator';
import { computeConfidence }   from './confidence';

export interface PipelineResult {
  findings:    NormalizedFinding[];
  toolsRan:    string[];
  toolsFailed: string[];
  durationMs:  number;
  warnings:    string[];
}

export async function runAnalysisPipeline(
  registry: AnalyzerRegistry,
  contract: ContractInput,
  context:  AnalysisContext,
): Promise<PipelineResult> {
  const start       = Date.now();
  const toolsRan:    string[] = [];
  const toolsFailed: string[] = [];
  const allWarnings: string[] = [];
  const allRaw:      RawAnalyzerFinding[] = [];

  const registrations = registry.forChain(contract.chain);

  if (registrations.length === 0) {
    context.logger.warn(
      { chain: contract.chain },
      'No analyzers registered for this chain — returning empty findings',
    );
    return { findings: [], toolsRan: [], toolsFailed: [], durationMs: 0, warnings: [] };
  }

  // Run all analyzers in parallel — Promise.allSettled means one failure
  // never blocks results from other analyzers.
  const results = await Promise.allSettled(
    registrations.map(async (reg) => {
      const id      = reg.analyzer.metadata.id;
      const timeout = reg.timeoutMs ?? context.timeoutMs;

      const analyzeWithTimeout = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Analyzer ${id} timed out after ${timeout}ms`)),
          timeout,
        );
        reg.analyzer.analyze(contract).then(
          (result) => {
            clearTimeout(timer);
            if (!result.success && result.findings.length === 0) {
              reject(new Error(result.error ?? `${id} reported failure`));
              return;
            }
            if (result.warnings.length > 0) {
              allWarnings.push(...result.warnings.map((w) => `[${id}] ${w}`));
            }
            allRaw.push(...result.findings);
            toolsRan.push(id);
            resolve();
          },
          (err) => { clearTimeout(timer); reject(err); },
        );
      });

      await analyzeWithTimeout;
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const r   = results[i];
    const id  = registrations[i].analyzer.metadata.id;
    if (r.status === 'rejected') {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      context.logger.warn({ analyzer: id, err: msg }, 'Analyzer failed — partial results used');
      toolsFailed.push(id);
    }
  }

  // ── Normalize → Deduplicate → Score ──────────────────────────────────────
  const normalized   = normalizeFindings(allRaw, contract.source);
  const correlated   = correlateByLocation(normalized);
  const withConfidence = correlated.map(computeConfidence);

  return {
    findings:    withConfidence,
    toolsRan,
    toolsFailed,
    durationMs:  Date.now() - start,
    warnings:    allWarnings,
  };
}
