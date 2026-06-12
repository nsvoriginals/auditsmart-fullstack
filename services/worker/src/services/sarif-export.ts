// SARIF 2.1.0 exporter — produces GitHub-compatible Static Analysis Results
// Interchange Format output from a set of NormalizedFindings.
// Consumed by GitHub Code Scanning and CI annotation systems.
import { NormalizedFinding, getSwcMeta } from '@auditsmart/shared';

// ── SARIF type definitions (subset of spec) ───────────────────────────────────

interface SarifMessage     { text: string }
interface SarifArtifactUri { uri: string; uriBaseId?: string }
interface SarifRegion      { startLine: number; endLine: number; startColumn?: number }
interface SarifPhysicalLocation { artifactLocation: SarifArtifactUri; region: SarifRegion }
interface SarifLocation    { physicalLocation: SarifPhysicalLocation; logicalLocations?: Array<{ name: string; kind: string }> }

interface SarifResult {
  ruleId:    string;
  level:     'error' | 'warning' | 'note' | 'none';
  message:   SarifMessage;
  locations: SarifLocation[];
  fingerprints?: Record<string, string>;
  partialFingerprints?: Record<string, string>;
  properties?: Record<string, unknown>;
  relatedLocations?: SarifLocation[];
}

interface SarifRule {
  id:               string;
  name:             string;
  shortDescription: SarifMessage;
  fullDescription:  SarifMessage;
  helpUri?:         string;
  properties?: {
    tags?:     string[];
    precision?: string;
    severity?:  string;
    'security-severity'?: string;
  };
}

interface SarifRun {
  tool: {
    driver: {
      name:            string;
      version:         string;
      informationUri?: string;
      rules:           SarifRule[];
    };
  };
  results:   SarifResult[];
  artifacts?: Array<{ location: SarifArtifactUri }>;
}

export interface SarifLog {
  version:  '2.1.0';
  $schema:  string;
  runs:     SarifRun[];
}

// ── Severity → SARIF level ────────────────────────────────────────────────────

const SEVERITY_LEVEL: Record<string, SarifResult['level']> = {
  critical: 'error',
  high:     'error',
  medium:   'warning',
  low:      'note',
  info:     'note',
};

// CVSS-style numeric for GitHub's "security-severity" extension (0–10 scale)
const SECURITY_SEVERITY: Record<string, string> = {
  critical: '9.8',
  high:     '7.5',
  medium:   '5.0',
  low:      '3.1',
  info:     '1.0',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function swcHelpUri(swcId: string): string {
  const id = swcId.replace('SWC-', '');
  if (!id || id === '000') return 'https://swcregistry.io/';
  return `https://swcregistry.io/docs/SWC-${id}`;
}

function buildRule(finding: NormalizedFinding): SarifRule {
  const swcMeta = getSwcMeta(finding.swcId);
  const cweList = swcMeta.cweIds.map((c) => c.toLowerCase());

  return {
    id:               finding.swcId,
    name:             finding.type.replace(/\s+/g, ''),
    shortDescription: { text: `${finding.swcId}: ${finding.type}` },
    fullDescription:  { text: swcMeta.description },
    helpUri:          swcHelpUri(finding.swcId),
    properties: {
      tags:                ['security', 'solidity', finding.category],
      precision:           finding.confidence >= 70 ? 'high' : finding.confidence >= 40 ? 'medium' : 'low',
      severity:            finding.severity,
      'security-severity': SECURITY_SEVERITY[finding.severity] ?? '5.0',
      ...(cweList.length > 0 && { tags: ['security', 'solidity', finding.category, ...cweList] }),
    },
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function exportSarif(
  findings:     NormalizedFinding[],
  auditId:      string,
  contractName: string = 'Contract.sol',
): SarifLog {
  const rulesMap = new Map<string, SarifRule>();
  const results:  SarifResult[] = [];

  for (const f of findings) {
    if (!rulesMap.has(f.swcId)) {
      rulesMap.set(f.swcId, buildRule(f));
    }

    const tools  = f.detectors.map((d) => d.tool).join(', ');
    const cweTag  = f.cweIds.length > 0 ? ` [${f.cweIds.join(', ')}]` : '';

    results.push({
      ruleId: f.swcId,
      level:  SEVERITY_LEVEL[f.severity] ?? 'warning',
      message: {
        text: `${f.type}${cweTag}\n\nDetected by: ${tools}\nConfidence: ${f.confidence}%\n\n${
          f.narrativeExplanation ?? f.detectors[0]?.rawOutput ?? ''
        }`.trim(),
      },
      locations: [{
        physicalLocation: {
          artifactLocation: { uri: f.file, uriBaseId: '%SRCROOT%' },
          region: {
            startLine: Math.max(1, f.lineStart),
            endLine:   Math.max(1, f.lineEnd || f.lineStart),
          },
        },
      }],
      fingerprints:        { 'auditsmart/v1': f.fingerprint },
      partialFingerprints: { 'primaryLocationLineHash/v1': `${f.file}:${f.lineStart}` },
      properties: {
        auditId,
        category:    f.category,
        swcId:       f.swcId,
        cweIds:      f.cweIds,
        confidence:  f.confidence,
        confirmedBy: f.confirmedBy,
        detectors:   f.detectors.map((d) => d.tool),
        ...(f.fixRecommendation && { fix: f.fixRecommendation }),
        ...(f.exploitScenario   && { exploitScenario: f.exploitScenario }),
        ...(f.similarExploits?.length && {
          similarExploits: f.similarExploits.map((e) => ({
            name:      e.name,
            protocol:  e.protocol,
            lossUsd:   e.amountLostUsd,
            similarity: e.similarity,
          })),
        }),
      },
    });
  }

  return {
    version: '2.1.0',
    $schema:  'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    runs: [{
      tool: {
        driver: {
          name:            'AuditSmart',
          version:         '1.0.0',
          informationUri:  'https://auditsmart.io',
          rules:           Array.from(rulesMap.values()),
        },
      },
      results,
      artifacts: [{
        location: { uri: contractName, uriBaseId: '%SRCROOT%' },
      }],
    }],
  };
}
