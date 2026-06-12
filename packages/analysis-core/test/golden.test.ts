// packages/analysis-core/test/golden.test.ts
//
// Golden corpus: realistic multi-tool outputs for known-vulnerable contracts,
// run through the FULL pipeline (correlate → computeConfidence → ship filter).
// Asserts end-to-end behaviour, not unit internals. This is the regression net
// the v3 repo never had.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correlate } from '../src/correlator.js';
import { scoreAll, isShippable } from '../src/confidence.js';
import type { FindingV4 } from '../src/types.js';
import { makeFinding } from './helpers.js';

interface GoldenCase {
  name: string;
  raw: FindingV4[];
  expect: {
    mergedCount: number;
    shippableCount: number;
    /** category → minimum confidence we expect after scoring */
    minConfidence?: Record<string, number>;
  };
}

const CORPUS: GoldenCase[] = [
  {
    // The DAO: single-function reentrancy in withdraw(), caught by 3 tools at
    // the same site + a spurious AI-only "oracle" hallucination elsewhere.
    name: 'reentrant-withdraw (DAO-shaped)',
    raw: [
      makeFinding({ tool: 'slither', detectorName: 'reentrancy-eth', category: 'reentrancy', severity: 'critical', lineStart: 50, lineEnd: 56 }),
      makeFinding({ tool: 'mythril', detectorName: 'state access after external call', category: 'reentrancy', severity: 'high', lineStart: 52, lineEnd: 55 }),
      makeFinding({ tool: 'semgrep', detectorName: 'reentrancy', category: 'reentrancy', severity: 'high', lineStart: 51, lineEnd: 51 }),
      // AI-only hallucination — must be present but NOT shippable
      makeFinding({ tool: 'groq', detectorName: 'oracle-manipulation-specialist', category: 'oracle-manipulation', severity: 'high', lineStart: 120, lineEnd: 124 }),
    ],
    expect: {
      mergedCount: 2, // one reentrancy cluster + one lone AI oracle finding
      shippableCount: 1, // only the confirmed reentrancy ships
      minConfidence: { reentrancy: 90 },
    },
  },
  {
    // Parity multisig: unprotected delegatecall / selfdestruct (access-control).
    name: 'unprotected-selfdestruct (Parity-shaped)',
    raw: [
      makeFinding({ tool: 'slither', detectorName: 'suicidal', category: 'access-control', swcId: 'SWC-106', severity: 'critical', lineStart: 88, lineEnd: 90 }),
      makeFinding({ tool: 'mythril', detectorName: 'unprotected selfdestruct', category: 'access-control', swcId: 'SWC-106', severity: 'critical', lineStart: 88, lineEnd: 90 }),
    ],
    expect: {
      mergedCount: 1,
      shippableCount: 1,
      minConfidence: { 'access-control': 95 },
    },
  },
  {
    // Echidna proves an arithmetic invariant break — single tool but PROVEN.
    name: 'proven-arithmetic-invariant (fuzz counterexample)',
    raw: [
      makeFinding({ tool: 'echidna', detectorName: 'invariant-violated', category: 'arithmetic', swcId: 'SWC-101', severity: 'high', exploitability: 'proven', lineStart: 30, lineEnd: 34 }),
    ],
    expect: {
      mergedCount: 1,
      shippableCount: 1,
      minConfidence: { arithmetic: 95 },
    },
  },
  {
    // Pure LLM noise across the board — nothing should ship.
    name: 'llm-only-noise',
    raw: [
      makeFinding({ tool: 'groq', detectorName: 'defi-logic-specialist', category: 'logic-error', lineStart: 10, lineEnd: 12 }),
      makeFinding({ tool: 'gemini', detectorName: 'gas-optimization-analyst', category: 'denial-of-service', lineStart: 200, lineEnd: 201 }),
    ],
    expect: {
      mergedCount: 2,
      shippableCount: 0,
    },
  },
];

for (const c of CORPUS) {
  test(`golden: ${c.name}`, () => {
    const merged = correlate(c.raw);
    assert.equal(merged.length, c.expect.mergedCount, `mergedCount for ${c.name}`);

    const scored = scoreAll(merged);
    const shippable = scored.filter((f) => isShippable(f));
    assert.equal(shippable.length, c.expect.shippableCount, `shippableCount for ${c.name}`);

    if (c.expect.minConfidence) {
      for (const [category, min] of Object.entries(c.expect.minConfidence)) {
        const f = scored.find((x) => x.category === category);
        assert.ok(f, `expected a ${category} finding in ${c.name}`);
        assert.ok(
          f!.confidence >= min,
          `${c.name}/${category}: confidence ${f!.confidence} < expected ${min}`,
        );
      }
    }
  });
}

test('golden: no finding is ever marked proven without a fuzz/concrete detector', () => {
  for (const c of CORPUS) {
    for (const f of correlate(c.raw)) {
      if (f.exploitability === 'proven') {
        const hasProof = f.evidence.some((e) => e.kind === 'fuzz' || e.kind === 'concrete');
        assert.ok(hasProof, `${c.name}: 'proven' without fuzz/concrete evidence`);
      }
    }
  }
});
