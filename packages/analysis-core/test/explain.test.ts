// Rule 3 (explainable, reproducible confidence — no magic numbers) and
// Rule 4 (evidence hierarchy Level 0–5). Also asserts the explanation can never
// diverge from the score: computeConfidence === explainConfidence().confidence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, type RawDetection } from "../src/normalize.js";
import { correlate } from "../src/correlator.js";
import {
  computeConfidence,
  explainConfidence,
  evidenceLevel,
  AI_ONLY_CEILING,
} from "../src/confidence.js";

const swcToCwe = (): string[] => [];

function det(o: Partial<RawDetection> & Pick<RawDetection, "tool" | "detectorName">): RawDetection {
  return {
    type: o.type ?? o.detectorName,
    severity: o.severity ?? "high",
    file: o.file ?? "Vault.sol",
    lineStart: o.lineStart ?? 40,
    lineEnd: o.lineEnd ?? 44,
    ...o,
  };
}

test("score and explanation never diverge", () => {
  const cases: RawDetection[][] = [
    [det({ tool: "slither", detectorName: "reentrancy-eth" })],
    [det({ tool: "groq", detectorName: "reentrancy-specialist" })],
    [det({ tool: "echidna", detectorName: "invariant-violated", counterExample: "drains" })],
  ];
  for (const raw of cases) {
    const [f] = correlate(normalize(raw, { swcToCwe }));
    assert.equal(computeConfidence(f).confidence, explainConfidence(f).confidence);
  }
});

test("confidence is reproducible from the published Bayesian formula", () => {
  // single slither reentrancy-eth: TPR 0.85 → P(true)=1-(1-0.85)=0.85 → 85%
  const [f] = normalize([det({ tool: "slither", detectorName: "reentrancy-eth" })], { swcToCwe });
  const e = explainConfidence(f);
  assert.equal(e.tools.length, 1);
  assert.ok(Math.abs(e.bayesian - 85) < 0.001, `expected 85, got ${e.bayesian}`);
  assert.equal(e.confidence, 85);
  assert.equal(e.capApplied, null);
  assert.match(e.formula, /P\(true\)=1−\(1−0\.85\)/);
});

test("AI-only confidence never exceeds the ceiling; cap recorded exactly when it bites", () => {
  // Two stacked AI tools so the raw Bayesian can rise toward/over the ceiling.
  const a = normalize([det({ tool: "groq", detectorName: "reentrancy-specialist" })], { swcToCwe })[0];
  const b = normalize([det({ tool: "gemini", detectorName: "made-up" })], { swcToCwe })[0];
  const f = { ...a, detectors: [...a.detectors, ...b.detectors] };
  const e = explainConfidence(f);
  assert.equal(e.evidenceLevel, 0, "AI-only");
  assert.ok(e.confidence <= AI_ONLY_CEILING, "AI-only must stay <= ceiling");
  // TPR-agnostic invariant: cap is applied iff the raw Bayesian exceeded it.
  assert.equal(e.capApplied === "ai-ceiling", e.bayesian > AI_ONLY_CEILING);
});

test("proven exploit shows the proven-floor cap", () => {
  const [f] = normalize(
    [det({ tool: "echidna", detectorName: "weak", counterExample: "drains" })],
    { swcToCwe }
  );
  const e = explainConfidence(f);
  // echidna alone with a low TPR but a real PoC → floored, cap recorded
  assert.equal(e.exploitability, "proven");
  assert.equal(e.evidenceLevel, 4);
  if (e.bayesian < 95) assert.equal(e.capApplied, "proven-floor");
});

test("evidence hierarchy (Rule 4) maps correctly", () => {
  const lvl = (raw: RawDetection[]) => evidenceLevel(correlate(normalize(raw, { swcToCwe }))[0]);
  assert.equal(lvl([det({ tool: "groq", detectorName: "x" })]), 0, "AI only");
  assert.equal(lvl([det({ tool: "slither", detectorName: "reentrancy-eth" })]), 1, "single static");
  assert.equal(
    lvl([
      det({ tool: "slither", detectorName: "reentrancy-eth" }),
      det({ tool: "semgrep", detectorName: "reentrancy" }),
    ]),
    2,
    "multi-tool"
  );
  assert.equal(lvl([det({ tool: "mythril", detectorName: "external-call" })]), 3, "dynamic symbolic");
  assert.equal(lvl([det({ tool: "echidna", detectorName: "weak", counterExample: "drains" })]), 4, "proven");
});
