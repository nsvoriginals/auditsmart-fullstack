# ADR-001: Deterministic-First Analysis Architecture

**Status:** Accepted  
**Date:** 2026-05-25  
**Deciders:** Platform team

## Context

Smart contract auditing platforms commonly use LLMs to detect vulnerabilities
directly from source code. This approach has critical failure modes:

- LLMs hallucinate findings (false positives erode trust immediately)
- LLM outputs are non-reproducible (same contract = different findings)
- No deterministic evidence = no explainability = no enterprise adoption

## Decision

AI is an explanation layer, not a detection layer.

The pipeline executes as follows:

1. Deterministic engines run first: Slither → Semgrep → AST → (Mythril)
2. Findings are normalized to `NormalizedFinding` with fingerprints
3. Findings are correlated and deduplicated by location
4. Confidence is scored from tool evidence only (no LLM opinion in scoring)
5. AI (Claude) then adds: narrative, exploit scenario, fix recommendation, business impact
6. AI never adds new findings. It only enriches confirmed ones.

This is enforced in code: `audit.worker.ts` runs AI only via `QUEUES.AI_ENHANCEMENT`
which consumes `findingIds` — existing finding IDs only.

## Evidence Weights (from confidence.ts)

| Tool | Weight | Reason |
|------|--------|--------|
| Echidna | 50 | Fuzzer counterexample is executable proof |
| Mythril | 40 | Symbolic execution explores real paths |
| Slither | 35 | 100+ high-quality deterministic detectors |
| AST | 25 | Structural checks on exact parse tree |
| Semgrep | 20 | Pattern matching — can have false positives |
| Groq | 15 | LLM: useful signal, not proof |

## Consequences

- Every finding displayed to a customer is backed by a deterministic tool
- AI explanations are clearly labeled as AI-generated
- Reports are reproducible (same contract + same tool versions = same findings)
- Confidence scores are trustworthy — not LLM self-assessment
