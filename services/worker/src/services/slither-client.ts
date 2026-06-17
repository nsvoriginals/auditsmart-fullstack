// HTTP client for the Slither analysis sidecar.
// Translates sidecar response into RawFinding[] understood by normalizer.ts.
import { childLogger }       from '../lib/logger';
import { RawFinding }        from './normalizer';
import { getSlitherMeta }    from '@auditsmart/shared';

const log = childLogger('slither-client');

const SLITHER_URL = process.env.SLITHER_SERVICE_URL ?? 'http://slither:8001';
const TIMEOUT_MS  = parseInt(process.env.SLITHER_TIMEOUT_MS ?? '130000', 10);

// ── Types matching services/slither/main.py response ─────────────────────────

interface SlitherFinding {
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

interface SlitherResponse {
  success:  boolean;
  findings: SlitherFinding[];
  error:    string | null;
  version:  string | null;
}

// ── Severity normalisation ────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, RawFinding['severity']> = {
  critical: 'critical',
  high:     'high',
  medium:   'medium',
  low:      'low',
  info:     'info',
};

function mapSeverity(raw: string): RawFinding['severity'] {
  // Slither impact can be overridden by our canonical map based on detector name.
  // If not found in our map, fall back to the sidecar's severity field.
  return SEVERITY_MAP[raw.toLowerCase()] ?? 'info';
}

// ── Client ────────────────────────────────────────────────────────────────────

export async function runSlitherAnalysis(
  contractCode: string,
  contractName: string = 'Contract',
): Promise<RawFinding[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(`${SLITHER_URL}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: contractCode, contract_name: contractName }),
      signal:  controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort') || msg.includes('timeout')) {
      log.warn({ contractName }, 'Slither request timed out — skipping');
    } else {
      log.warn({ contractName, err: msg }, 'Slither service unreachable — skipping');
    }
    return [];
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    log.warn({ status: resp.status, contractName }, 'Slither returned non-OK status — skipping');
    return [];
  }

  const body: SlitherResponse = await resp.json();

  if (!body.success && body.findings.length === 0) {
    log.warn({ contractName, error: body.error }, 'Slither analysis failed');
    return [];
  }

  if (body.error) {
    log.warn({ contractName, error: body.error }, 'Slither partial failure — using available findings');
  }

  const findings: RawFinding[] = body.findings.map((f) => {
    // Look up canonical SWC + severity from detector name (our map overrides sidecar)
    const meta = getSlitherMeta(f.type);
    return {
      tool:        'slither',
      agentName:   f.agent_name,
      // Keep the RAW Slither check name (e.g. "reentrancy-eth") for canonical
      // category/TPR resolution; `type` carries the human-readable title.
      detectorName: f.type,
      type:        meta.title,
      severity:    meta.severity !== 'info' ? meta.severity : mapSeverity(f.severity),
      file:        f.file || 'Contract.sol',
      lineStart:   f.line_start,
      lineEnd:     f.line_end,
      description: f.description,
      codeSnippet: f.code_snippet,
      swcId:       meta.swcId,
    } satisfies RawFinding;
  });

  log.info(
    { contractName, count: findings.length, solcVersion: body.version },
    'Slither analysis complete',
  );
  return findings;
}

// ── Health probe ──────────────────────────────────────────────────────────────

export async function isSlitherAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${SLITHER_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return resp.ok;
  } catch {
    return false;
  }
}
