// Locks the product's load-bearing guarantee end-to-end: AI is NEVER the source
// of truth. An AI-only detection cannot become "proven" and cannot reach the
// ship threshold on its own — only an executable counterexample (Echidna/Foundry
// PoC, set by the sandboxed exploit runner) lifts a finding to PROVEN.
//
// This guards the full normalize → scoreAll chain, not just confidence() in
// isolation. If someone later makes normalize derive `proven` from AI severity
// or text, this test fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, type RawDetection } from "../src/normalize.js";
import { scoreAll, isShippable, AI_ONLY_CEILING, SHIP_THRESHOLD } from "../src/confidence.js";

const swcToCwe = (): string[] => [];

function det(o: Partial<RawDetection> & Pick<RawDetection, "tool" | "detectorName">): RawDetection {
  return {
    type: o.type ?? o.detectorName,
    severity: o.severity ?? "critical",
    file: o.file ?? "Vault.sol",
    lineStart: o.lineStart ?? 40,
    lineEnd: o.lineEnd ?? 44,
    ...o,
  };
}

test("AI-only detection (no counterexample) is never 'proven' and never ships", () => {
  const [f] = normalize([det({ tool: "groq", detectorName: "reentrancy-specialist" })], { swcToCwe });
  assert.notEqual(f.exploitability, "proven", "AI text alone must not be 'proven'");
  assert.equal(f.exploitability, "unconfirmed");

  const [scored] = scoreAll([f]);
  assert.ok(scored.confidence <= AI_ONLY_CEILING, `AI-only must stay <= ${AI_ONLY_CEILING}, got ${scored.confidence}`);
  assert.equal(isShippable(scored), false, "AI-only finding must not clear the ship threshold");
});

test("AI claiming 'critical' severity cannot manufacture confidence", () => {
  // Severity is attacker/AI-influenced; it must not feed the confidence math.
  const [scored] = scoreAll(
    normalize([det({ tool: "gemini", detectorName: "made-up", severity: "critical" })], { swcToCwe })
  );
  assert.ok(scored.confidence <= AI_ONLY_CEILING, "severity must not lift AI-only confidence");
});

test("only an executable counterexample lifts a finding to PROVEN", () => {
  const [f] = normalize(
    [det({ tool: "echidna", detectorName: "invariant-violated", counterExample: "call withdraw() twice -> drains" })],
    { swcToCwe }
  );
  assert.equal(f.exploitability, "proven");

  const [scored] = scoreAll([f]);
  assert.ok(scored.confidence >= SHIP_THRESHOLD, "a proven PoC must clear the ship threshold");
  assert.equal(isShippable(scored), true);
});

test("a real deterministic tool (slither) lifts an AI finding above the ceiling when correlated", () => {
  // Same location, AI + Slither — multi-tool confirmation is what legitimately
  // raises confidence, not the AI.
  const findings = normalize(
    [
      det({ tool: "groq", detectorName: "reentrancy-specialist" }),
      det({ tool: "slither", detectorName: "reentrancy-eth" }),
    ],
    { swcToCwe }
  );
  // Merge into one finding with both detectors, then score.
  const merged = { ...findings[0], detectors: [...findings[0].detectors, ...findings[1].detectors] };
  const [scored] = scoreAll([merged]);
  assert.ok(scored.confidence > AI_ONLY_CEILING, "a real tool, not the AI, is what lifts the cap");
});
