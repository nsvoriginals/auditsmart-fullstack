// packages/analyzer-sdk/src/adapters/semgrep.adapter.ts
// In-process Semgrep adapter — spawns the semgrep CLI as a child process.
import { spawn }             from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import * as path             from 'path';
import * as os               from 'os';
import type {
  Analyzer, AnalyzerMetadata, AnalysisContext,
  ContractInput, AnalysisResult, RawAnalyzerFinding,
} from '../types';

interface SemgrepResult {
  rule_id?: string;
  check_id?: string;
  path: string;
  start: { line: number };
  end:   { line: number };
  extra: {
    message:  string;
    severity: string;
    metadata?: { cwe?: string[]; swc_id?: string; impact?: string };
    lines?:   string;
  };
}

const SEM_SEVERITY: Record<string, string> = {
  error: 'high', warning: 'medium', info: 'info',
};

function inferSwcFromRuleId(id: string): string {
  const r = id.toLowerCase();
  if (r.includes('reentrancy'))        return 'SWC-107';
  if (r.includes('tx-origin'))         return 'SWC-115';
  if (r.includes('timestamp'))         return 'SWC-116';
  if (r.includes('unchecked'))         return 'SWC-104';
  if (r.includes('selfdestruct'))      return 'SWC-106';
  if (r.includes('delegatecall'))      return 'SWC-112';
  if (r.includes('overflow'))          return 'SWC-101';
  if (r.includes('prng') || r.includes('random')) return 'SWC-120';
  if (r.includes('arbitrary-send'))    return 'SWC-105';
  if (r.includes('zero-address'))      return 'SWC-131';
  if (r.includes('encode-packed'))     return 'SWC-133';
  return 'SWC-000';
}

export class SemgrepAnalyzer implements Analyzer {
  readonly metadata: AnalyzerMetadata = {
    id:             'semgrep',
    name:           'Semgrep Rules-Based Analyzer',
    version:        '1.x',
    chain:          'evm',
    capabilities:   ['static-analysis'],
    tools:          [{ name: 'semgrep', version: 'latest' }],
    evidenceWeight: 20,
  };

  private timeoutMs = 60_000;

  async prepare(ctx: AnalysisContext): Promise<void> {
    this.timeoutMs = ctx.timeoutMs;
    // Verify semgrep is in PATH
    await new Promise<void>((resolve, reject) => {
      const p = spawn('semgrep', ['--version'], { stdio: 'ignore' });
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error('semgrep not found'))));
      p.on('error', reject);
    });
  }

  async analyze(contract: ContractInput): Promise<AnalysisResult> {
    const start   = Date.now();
    const tmpFile = path.join(os.tmpdir(), `as-${Date.now()}-${contract.filename}`);

    try {
      await writeFile(tmpFile, contract.source, 'utf-8');
    } catch {
      return { success: false, findings: [], durationMs: Date.now() - start, warnings: [], error: 'Failed to write temp file' };
    }

    const findings = await new Promise<RawAnalyzerFinding[]>((resolve) => {
      const proc = spawn('semgrep', [
        '--config=p/solidity', tmpFile, '--json', '--no-git-ignore', '--quiet',
      ], { stdio: ['ignore', 'pipe', 'pipe'] });

      let stdout = '';
      proc.stdout.on('data', (d: Buffer) => { stdout += d; });

      const timer = setTimeout(() => { proc.kill(); resolve([]); }, this.timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === null || code > 1 || !stdout.trim()) { resolve([]); return; }
        try {
          const parsed = JSON.parse(stdout);
          const results: RawAnalyzerFinding[] = (parsed.results ?? []).map((r: SemgrepResult) => {
            const ruleId   = r.rule_id ?? r.check_id ?? 'unknown';
            const meta     = r.extra.metadata ?? {};
            const swcId    = meta.swc_id ?? inferSwcFromRuleId(ruleId);
            const ruleSlug = ruleId.split('.').pop() ?? ruleId;
            const title    = ruleSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return {
              tool:        'semgrep',
              detectorId:  ruleSlug,
              title,
              severity:    SEM_SEVERITY[(meta.impact ?? r.extra.severity).toLowerCase()] ?? 'info',
              file:        path.basename(r.path),
              lineStart:   r.start.line,
              lineEnd:     r.end.line,
              description: r.extra.message?.slice(0, 400) ?? '',
              codeSnippet: r.extra.lines?.slice(0, 500) ?? '',
              swcId,
            } satisfies RawAnalyzerFinding;
          });
          resolve(results);
        } catch {
          resolve([]);
        }
      });
      proc.on('error', () => { clearTimeout(timer); resolve([]); });
    });

    try { await unlink(tmpFile); } catch { /* best-effort */ }

    return { success: true, findings, durationMs: Date.now() - start, warnings: [] };
  }

  async cleanup(): Promise<void> { /* in-process: nothing to close */ }
}
