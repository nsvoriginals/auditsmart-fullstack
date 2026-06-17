// packages/analysis-core/test/normalize.test.ts
//
// End-to-end proof of the v4 pipeline on the reentrancy slice:
//   raw tool detections → normalize → correlate → scoreAll
// This is the test the v3 path could never pass (raw `type` strings never
// matched across tools, so multi-tool confirmation never fired).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, type RawDetection } from '../src/normalize.js';
import { correlate } from '../src/correlator.js';
import { scoreAll, AI_ONLY_CEILING, isShippable } from '../src/confidence.js';

const swcToCwe = (swc: string): string[] => (swc === 'SWC-107' ? ['CWE-841'] : []);

function det(o: Partial<RawDetection> & Pick<RawDetection, 'tool' | 'detectorName'>): RawDetection {
  return {
    type: o.type ?? o.detectorName,
    severity: o.severity ?? 'high',
    file: o.file ?? 'Vault.sol',
    lineStart: o.lineStart ?? 40,
    lineEnd: o.lineEnd ?? 44,
    ...o,
  };
}

test('normalize resolves the canonical category + SWC from the raw detector slug', () => {
  const [f] = normalize([det({ tool: 'slither', detectorName: 'reentrancy-eth' })], { swcToCwe });
  assert.equal(f!.category, 'reentrancy');
  assert.equal(f!.swcId, 'SWC-107');
  assert.deepEqual(f!.cweIds, ['CWE-841']);
  assert.equal(f!.detectors[0]!.detectorName, 'reentrancy-eth');
  assert.equal(f!.confirmedBy, 1);
});

test('THE v3 BUG FIX: three tools with DIFFERENT raw names merge into one reentrancy finding', () => {
  // Slither, Semgrep and AST describe the same bug with different slugs/titles.
  // v3 merged on byte-identical `type` → never merged. v4 merges on (file,
  // canonical category, overlapping lines).
  const raw: RawDetection[] = [
    det({ tool: 'slither', detectorName: 'reentrancy-eth', type: 'Reentrancy (ETH)', lineStart: 40, lineEnd: 44 }),
    det({ tool: 'semgrep', detectorName: 'reentrancy', type: 'Reentrancy', lineStart: 41, lineEnd: 43 }),
    det({ tool: 'ast', detectorName: 'ast-reentrancy-detector', type: 'Missing nonReentrant guard', lineStart: 40, lineEnd: 45 }),
  ];

  const merged = correlate(normalize(raw, { swcToCwe }));
  assert.equal(merged.length, 1, 'all three collapse into one finding');
  assert.equal(merged[0]!.confirmedBy, 3, 'three independent tools confirmed');

  const [scored] = scoreAll(merged);
  // 1 - (1-0.85)(1-0.55)(1-0.50) = 1 - 0.03375 = 0.966 → 97
  assert.equal(scored!.confidence, 97);
  assert.ok(isShippable(scored!), 'multi-tool reentrancy ships');
});

test('AI-only reentrancy is normalized as unconfirmed and capped below ship threshold', () => {
  const raw = [det({ tool: 'groq', detectorName: 'reentrancy-specialist', severity: 'critical' })];
  const [f] = normalize(raw, { swcToCwe });
  assert.equal(f!.exploitability, 'unconfirmed');

  const [scored] = scoreAll(correlate(normalize(raw, { swcToCwe })));
  assert.ok(scored!.confidence <= AI_ONLY_CEILING);
  assert.equal(isShippable(scored!), false, 'AI alone cannot ship a finding');
});

test('an Echidna counterexample normalizes to PROVEN and survives correlation', () => {
  const raw: RawDetection[] = [
    det({ tool: 'slither', detectorName: 'reentrancy-eth', lineStart: 40, lineEnd: 44 }),
    det({
      // A reproduction proof is attributed to the finding it proves: the harness
      // was generated FOR the reentrancy finding, so it carries SWC-107 →
      // resolves to the `reentrancy` category and correlates with the static hit.
      tool: 'echidna',
      detectorName: 'reentrancy-invariant-violated',
      swcId: 'SWC-107',
      lineStart: 42,
      lineEnd: 42,
      counterExample: 'echidna_no_drain(): failed! sequence: [deposit(1), reenter()]',
    }),
  ];
  const merged = correlate(normalize(raw, { swcToCwe }));
  assert.equal(merged[0]!.exploitability, 'proven');
  assert.ok(merged[0]!.detectors.some((d) => d.counterExample), 'counterexample preserved as evidence');

  const [scored] = scoreAll(merged);
  assert.ok(scored!.confidence >= 95, 'proven dominates');
});

test('normalize is pure and drops malformed detections', () => {
  const raw = [
    det({ tool: 'slither', detectorName: 'reentrancy-eth' }),
    { tool: 'slither', detectorName: 'x', type: '', severity: 'high', file: 'a', lineStart: 1, lineEnd: 1 } as RawDetection,
  ];
  const out = normalize(raw, { swcToCwe });
  assert.equal(out.length, 1, 'empty-type detection dropped');
});
