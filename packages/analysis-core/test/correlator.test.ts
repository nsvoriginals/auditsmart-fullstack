// packages/analysis-core/test/correlator.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correlate, fingerprintOf, linesOverlapOrAdjacent } from '../src/correlator.js';
import { makeFinding } from './helpers.js';

test('empty input → empty output', () => {
  assert.deepEqual(correlate([]), []);
});

test('THE v3 BUG FIX: three tools, same location, different raw type strings → ONE finding', () => {
  // This is exactly what v3 failed to merge because it compared raw `type`.
  const findings = [
    makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', type: 'reentrancy-eth', lineStart: 40, lineEnd: 44 }),
    makeFinding({ tool: 'mythril', detectorName: 'state access after external call', type: 'External call before state update', lineStart: 41, lineEnd: 43 }),
    makeFinding({ tool: 'semgrep', detectorName: 'reentrancy', type: 'Unsafe call pattern', lineStart: 42, lineEnd: 42 }),
  ];
  const merged = correlate(findings);
  assert.equal(merged.length, 1, 'all three must collapse into one finding');
  assert.equal(merged[0]!.confirmedBy, 3, 'three independent tools must be counted');
  assert.equal(merged[0]!.detectors.length, 3);
  assert.equal(merged[0]!.evidence.length, 3);
});

test('union-find chains transitively-overlapping detections regardless of order', () => {
  // A overlaps B, B overlaps C, but A does NOT overlap C directly.
  const findings = [
    makeFinding({ tool: 'semgrep', detectorName: 'reentrancy', lineStart: 30, lineEnd: 31 }), // C
    makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', lineStart: 20, lineEnd: 22 }), // A
    makeFinding({ tool: 'mythril', detectorName: 'state access after external call', lineStart: 24, lineEnd: 28 }), // B
  ];
  const merged = correlate(findings);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]!.confirmedBy, 3);
});

test('different categories at same location do NOT merge', () => {
  const findings = [
    makeFinding({ tool: 'slither', category: 'reentrancy', lineStart: 10, lineEnd: 12 }),
    makeFinding({ tool: 'slither', detectorName: 'tx-origin', category: 'access-control', lineStart: 10, lineEnd: 12 }),
  ];
  const merged = correlate(findings);
  assert.equal(merged.length, 2, 'distinct vulnerability classes stay separate');
});

test('far-apart same-category findings do NOT merge', () => {
  const findings = [
    makeFinding({ category: 'reentrancy', lineStart: 10, lineEnd: 12 }),
    makeFinding({ category: 'reentrancy', lineStart: 200, lineEnd: 205 }),
  ];
  assert.equal(correlate(findings).length, 2);
});

test('merge takes highest severity and most-specific SWC', () => {
  const findings = [
    makeFinding({ tool: 'semgrep', severity: 'medium', swcId: 'SWC-000', lineStart: 10, lineEnd: 12 }),
    makeFinding({ tool: 'slither', severity: 'critical', swcId: 'SWC-107', lineStart: 11, lineEnd: 13 }),
  ];
  const [m] = correlate(findings);
  assert.equal(m!.severity, 'critical');
  assert.equal(m!.swcId, 'SWC-107');
  assert.equal(m!.lineStart, 10);
  assert.equal(m!.lineEnd, 13, 'line envelope spans the union');
});

test('exploitability escalates to the highest in the cluster', () => {
  const findings = [
    makeFinding({ tool: 'slither', exploitability: 'theoretical', lineStart: 10, lineEnd: 12 }),
    makeFinding({ tool: 'echidna', detectorName: 'invariant-violated', exploitability: 'proven', lineStart: 11, lineEnd: 11 }),
  ];
  const [m] = correlate(findings);
  assert.equal(m!.exploitability, 'proven');
});

test('duplicate detectors from the same tool are de-duped (not double-counted)', () => {
  const findings = [
    makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', lineStart: 10, lineEnd: 12 }),
    makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', lineStart: 11, lineEnd: 12 }),
  ];
  const [m] = correlate(findings);
  assert.equal(m!.confirmedBy, 1, 'same tool+detector is one piece of evidence');
  assert.equal(m!.detectors.length, 1);
});

test('fingerprint is stable across input order', () => {
  const a = makeFinding({ tool: 'slither', lineStart: 40, lineEnd: 44 });
  const b = makeFinding({ tool: 'mythril', detectorName: 'state access after external call', lineStart: 41, lineEnd: 43 });
  const fp1 = correlate([a, b])[0]!.fingerprint;
  const fp2 = correlate([b, a])[0]!.fingerprint;
  assert.equal(fp1, fp2);
  assert.equal(fp1, fingerprintOf('Contract.sol', 'reentrancy', 40));
});

test('linesOverlapOrAdjacent honours slack boundary', () => {
  assert.equal(linesOverlapOrAdjacent({ lineStart: 1, lineEnd: 5 }, { lineStart: 10, lineEnd: 12 }), true); // within slack 5
  assert.equal(linesOverlapOrAdjacent({ lineStart: 1, lineEnd: 5 }, { lineStart: 11, lineEnd: 12 }), false); // gap 6 > slack
});
