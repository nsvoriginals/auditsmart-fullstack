// Semgrep runner — spawns the semgrep CLI as a child process.
// Uses the p/solidity ruleset for broad coverage plus custom rules.
// Falls back gracefully if semgrep is not installed.
import { spawn }             from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import * as os               from 'os';
import * as path             from 'path';
import { childLogger }       from '../lib/logger';
import { RawFinding }        from './normalizer';

const log        = childLogger('semgrep');
const TIMEOUT_MS = parseInt(process.env.SEMGREP_TIMEOUT_MS ?? '60000', 10);

// ── Semgrep JSON output types ─────────────────────────────────────────────────

interface SemgrepResult {
  rule_id:  string;
  check_id?: string;
  path:     string;
  start:    { line: number; col: number };
  end:      { line: number; col: number };
  extra: {
    message:  string;
    severity: string;   // ERROR | WARNING | INFO
    metadata?: {
      cwe?:        string[];
      confidence?: string;
      swc_id?:     string;
      impact?:     string;
    };
    lines?: string;
  };
}

interface SemgrepOutput {
  results: SemgrepResult[];
  errors:  Array<{ message: string }>;
}

// ── Severity map ──────────────────────────────────────────────────────────────

const SEM_SEVERITY: Record<string, RawFinding['severity']> = {
  error:   'high',
  warning: 'medium',
  info:    'info',
};

function mapSeverity(impact: string): RawFinding['severity'] {
  return SEM_SEVERITY[impact.toLowerCase()] ?? 'info';
}

// ── Rule ID → SWC heuristic ───────────────────────────────────────────────────

function inferSwcFromRuleId(ruleId: string): string {
  const r = ruleId.toLowerCase();
  if (r.includes('reentrancy'))                return 'SWC-107';
  if (r.includes('tx-origin') || r.includes('tx_origin')) return 'SWC-115';
  if (r.includes('timestamp') || r.includes('block-timestamp')) return 'SWC-116';
  if (r.includes('unchecked') || r.includes('low-level')) return 'SWC-104';
  if (r.includes('selfdestruct') || r.includes('suicidal')) return 'SWC-106';
  if (r.includes('delegatecall'))              return 'SWC-112';
  if (r.includes('overflow') || r.includes('underflow')) return 'SWC-101';
  if (r.includes('prng') || r.includes('random')) return 'SWC-120';
  if (r.includes('arbitrary-send') || r.includes('arbitrary_send')) return 'SWC-105';
  if (r.includes('missing-zero') || r.includes('zero-address')) return 'SWC-131';
  if (r.includes('shadowing'))                 return 'SWC-119';
  if (r.includes('encode-packed') || r.includes('hash-collision')) return 'SWC-133';
  return 'SWC-000';
}

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runSemgrepAnalysis(
  contractCode: string,
  contractName: string = 'Contract',
): Promise<RawFinding[]> {
  const tmpFile = path.join(os.tmpdir(), `auditsmart-${Date.now()}-${contractName}.sol`);

  try {
    await writeFile(tmpFile, contractCode, 'utf-8');
  } catch (err) {
    log.warn({ err }, 'Failed to write temp file for Semgrep');
    return [];
  }

  const findings = await new Promise<RawFinding[]>((resolve) => {
    const args = [
      '--config=p/solidity',
      tmpFile,
      '--json',
      '--no-git-ignore',
      '--quiet',
    ];

    const proc = spawn('semgrep', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      log.warn({ contractName }, 'Semgrep timed out — skipping');
      resolve([]);
    }, TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(timer);

      if (code === null) {
        // Killed by timeout
        resolve([]);
        return;
      }

      // semgrep exits 0 (clean), 1 (findings found), or other (error)
      if (code > 1) {
        log.warn({ contractName, code, stderr: stderr.slice(0, 200) }, 'Semgrep exited with error');
        resolve([]);
        return;
      }

      if (!stdout.trim()) {
        log.debug({ contractName }, 'Semgrep: no output');
        resolve([]);
        return;
      }

      let parsed: SemgrepOutput;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        log.warn({ contractName, stdout: stdout.slice(0, 200) }, 'Failed to parse Semgrep JSON');
        resolve([]);
        return;
      }

      const results: RawFinding[] = (parsed.results ?? []).map((r) => {
        const meta     = r.extra.metadata ?? {};
        const swcId    = meta.swc_id ?? inferSwcFromRuleId(r.rule_id ?? r.check_id ?? '');
        const impact   = meta.impact ?? r.extra.severity;
        const ruleSlug = (r.rule_id ?? r.check_id ?? 'unknown').split('.').pop() ?? 'unknown';
        const title    = ruleSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        return {
          tool:        'semgrep',
          agentName:   `semgrep-${ruleSlug}`,
          // Raw rule slug (e.g. "reentrancy") for canonical category/TPR lookup.
          detectorName: ruleSlug,
          type:        title,
          severity:    mapSeverity(impact),
          file:        path.basename(r.path),
          lineStart:   r.start.line,
          lineEnd:     r.end.line,
          description: r.extra.message?.slice(0, 400) ?? '',
          codeSnippet: r.extra.lines?.slice(0, 500) ?? '',
          swcId,
        } satisfies RawFinding;
      });

      log.info({ contractName, count: results.length }, 'Semgrep analysis complete');
      resolve(results);
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        log.warn({ contractName }, 'semgrep not found in PATH — skipping');
      } else {
        log.warn({ contractName, err: err.message }, 'Semgrep process error — skipping');
      }
      resolve([]);
    });
  });

  try {
    await unlink(tmpFile);
  } catch { /* best-effort cleanup */ }

  return findings;
}
