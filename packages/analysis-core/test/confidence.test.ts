// packages/analysis-core/test/confidence.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correlate } from '../src/correlator.js';
import {
  AI_ONLY_CEILING,
  computeConfidence,
  isShippable,
  PROVEN_FLOOR,
  scoreAll,
} from '../src/confidence.js';
import { makeFinding } from './helpers.js';

test('single Slither reentrancy-eth ≈ its TPR (0.85)', () => {
  const f = computeConfidence(makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth' }));
  assert.equal(f.confidence, 85);
});

test('two independent tools combine Bayesianly above either alone', () => {
  // slither reentrancy-eth (0.85) + mythril state-access (0.85)
  // 1 - (0.15 * 0.15) = 0.9775 → 98
  const merged = correlate([
    makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', lineStart: 40, lineEnd: 44 }),
    makeFinding({ tool: 'mythril', detectorName: 'state access after external call', lineStart: 41, lineEnd: 43 }),
  ]);
  const scored = computeConfidence(merged[0]!);
  assert.equal(scored.confidence, 98);
  assert.ok(scored.confidence > 85, 'two tools must beat one');
});

test('THE v3 BUG FIX: AI-only finding is HARD-CAPPED below ship threshold', () => {
  // Groq alone, even claiming critical — must never be decisive.
  const f = computeConfidence(
    makeFinding({ tool: 'groq', detectorName: 'reentrancy-specialist', severity: 'critical' }),
  );
  assert.ok(f.confidence <= AI_ONLY_CEILING, `AI-only must be <= ${AI_ONLY_CEILING}, got ${f.confidence}`);
  assert.equal(isShippable(f), false, 'AI-only finding must not ship on its own');
});

test('two AI tools together are STILL capped (no laundering confidence via ensemble)', () => {
  const merged = correlate([
    makeFinding({ tool: 'groq', detectorName: 'reentrancy-specialist', lineStart: 10, lineEnd: 12 }),
    makeFinding({ tool: 'gemini', detectorName: 'erc-compliance-analyst', category: 'reentrancy', lineStart: 11, lineEnd: 12 }),
  ]);
  const scored = computeConfidence(merged[0]!);
  assert.ok(scored.confidence <= AI_ONLY_CEILING, 'stacking LLMs cannot exceed the ceiling');
});

test('AI + one deterministic tool IS allowed to ship (AI augments, not caps)', () => {
  const merged = correlate([
    makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', lineStart: 10, lineEnd: 12 }),
    makeFinding({ tool: 'groq', detectorName: 'reentrancy-specialist', lineStart: 11, lineEnd: 12 }),
  ]);
  const scored = computeConfidence(merged[0]!);
  assert.ok(scored.confidence > AI_ONLY_CEILING, 'one real tool lifts the cap');
  assert.equal(isShippable(scored), true);
});

test('proven exploitability floors confidence near-certain regardless of tool TPR', () => {
  const f = computeConfidence(
    makeFinding({ tool: 'echidna', detectorName: 'invariant-violated', exploitability: 'proven' }),
  );
  assert.ok(f.confidence >= PROVEN_FLOOR);
});

test('proven floor overrides the AI cap (a PoC that passes is a PoC)', () => {
  // Even if only an AI tool is attached, a proven counterexample dominates.
  const f = computeConfidence(
    makeFinding({ tool: 'groq', detectorName: 'reentrancy-specialist', exploitability: 'proven' }),
  );
  assert.ok(f.confidence >= PROVEN_FLOOR, 'proven beats the AI ceiling');
});

test('no detectors → confidence 0', () => {
  const base = makeFinding();
  const f = computeConfidence({ ...base, detectors: [] });
  assert.equal(f.confidence, 0);
});

test('scoreAll is pure and does not mutate inputs', () => {
  const inputs = [makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth' })];
  const out = scoreAll(inputs);
  assert.equal(inputs[0]!.confidence, 0, 'input must be untouched');
  assert.equal(out[0]!.confidence, 85);
});
