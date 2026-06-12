// packages/analyzer-sdk/src/adapters/slither.adapter.ts
// EVM analyzer adapter wrapping the Slither FastAPI sidecar.
// Implements the Analyzer interface — registered once at worker startup.
import type { Analyzer, AnalyzerMetadata, AnalysisContext, ContractInput, AnalysisResult, RawAnalyzerFinding } from '../types';
import { getSlitherMeta } from '@auditsmart/shared';

interface SlitherServiceFinding {
  tool:         string;
  agent_name:   string;
  type:         string;
  severity:     string;
  file:         string;
  line_start:   number;
  line_end:     number;
  description:  string;
  code_snippet: string;
  swc_id:       string;
  confidence:   string;
}

interface SlitherServiceResponse {
  success:  boolean;
  findings: SlitherServiceFinding[];
  error:    string | null;
  version:  string | null;
}

export class SlitherAnalyzer implements Analyzer {
  readonly metadata: AnalyzerMetadata = {
    id:             'slither',
    name:           'Slither Static Analyzer',
    version:        '0.10.3',
    chain:          'evm',
    capabilities:   ['static-analysis', 'diff-audit'],
    tools:          [{ name: 'slither', version: '0.10.3' }],
    evidenceWeight: 35,
  };

  private serviceUrl!: string;
  private timeoutMs!:  number;
  private logger!:     AnalysisContext['logger'];

  async prepare(ctx: AnalysisContext): Promise<void> {
    this.serviceUrl = ctx.serviceUrl ?? 'http://slither:8001';
    this.timeoutMs  = ctx.timeoutMs;
    this.logger     = ctx.logger;

    // Health check
    const resp = await fetch(`${this.serviceUrl}/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!resp.ok) throw new Error(`Slither service unhealthy: HTTP ${resp.status}`);
  }

  async analyze(contract: ContractInput): Promise<AnalysisResult> {
    const start = Date.now();
    let resp: Response;

    try {
      resp = await fetch(`${this.serviceUrl}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          code:          contract.source,
          contract_name: contract.filename.replace('.sol', ''),
          solc_version:  contract.compilerVersion ?? undefined,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      return {
        success:    false,
        findings:   [],
        durationMs: Date.now() - start,
        warnings:   [],
        error:      err instanceof Error ? err.message : String(err),
      };
    }

    if (!resp.ok) {
      return {
        success:    false,
        findings:   [],
        durationMs: Date.now() - start,
        warnings:   [],
        error:      `Slither sidecar HTTP ${resp.status}`,
      };
    }

    const body: SlitherServiceResponse = await resp.json();
    const findings: RawAnalyzerFinding[] = body.findings.map((f) => {
      const meta = getSlitherMeta(f.type);
      return {
        tool:           'slither',
        detectorId:     f.type,
        title:          meta.title,
        severity:       meta.severity !== 'info' ? meta.severity : f.severity,
        file:           f.file || contract.filename,
        lineStart:      f.line_start,
        lineEnd:        f.line_end,
        description:    f.description,
        codeSnippet:    f.code_snippet,
        swcId:          meta.swcId,
        toolConfidence: f.confidence,
      };
    });

    return {
      success:     body.success || findings.length > 0,
      findings,
      solcVersion: body.version ?? undefined,
      durationMs:  Date.now() - start,
      warnings:    body.error ? [`Slither partial: ${body.error}`] : [],
      error:       !body.success && findings.length === 0 ? (body.error ?? undefined) : undefined,
    };
  }

  async cleanup(): Promise<void> {
    // Stateless HTTP client — nothing to close
  }
}
