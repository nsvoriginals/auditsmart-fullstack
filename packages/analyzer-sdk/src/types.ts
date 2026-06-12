// packages/analyzer-sdk/src/types.ts
// Canonical plugin interface every chain analyzer must implement.
// Adding a new chain = implementing this interface. Nothing else changes.

import type { NormalizedFinding, FindingSeverity, VulnerabilityCategory } from '@auditsmart/shared';

// ── Chain families ────────────────────────────────────────────────────────────

export type ChainFamily =
  | 'evm'        // Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche
  | 'solana'     // Solana (Rust/Anchor)
  | 'cosmwasm'   // Cosmos ecosystem (Rust WASM)
  | 'ink'        // Polkadot / ink! (Rust WASM)
  | 'ton'        // TON (FunC / Tact)
  | 'starknet'   // StarkNet (Cairo)
  | 'near'       // NEAR (Rust WASM)
  | 'sui'        // Sui (Move)
  | 'aptos'      // Aptos (Move);

export type AnalyzerCapability =
  | 'static-analysis'      // pattern / AST / data-flow
  | 'symbolic-execution'   // path exploration
  | 'fuzzing'              // property-based / coverage
  | 'formal-verification'  // mathematical proof
  | 'bytecode-analysis'    // disassembly / EVM traces
  | 'diff-audit'           // only changed functions
  | 'upgrade-check'        // storage layout diff;

// ── Contract input ────────────────────────────────────────────────────────────

export interface ContractInput {
  /** Primary source code (text). */
  source:        string;
  /** Filename without path — used in findings and SARIF output. */
  filename:      string;
  /** Solidity version string (e.g. "0.8.19") or Rust toolchain. Auto-detected if null. */
  compilerVersion: string | null;
  /** Chain identifier as stored in the DB (e.g. "ethereum", "solana"). */
  chain:         string;
  /** Optional multi-file context (imported contracts). */
  imports?:      ImportedFile[];
  /** ABI, if available from a previous compilation step. */
  abi?:          unknown[];
  /** Already-compiled bytecode (skips recompilation). */
  bytecode?:     string;
}

export interface ImportedFile {
  path:    string;
  source:  string;
}

// ── Raw finding produced by an analyzer ──────────────────────────────────────
// Before normalization — each analyzer speaks this lingua franca.

export interface RawAnalyzerFinding {
  /** The analyzer that produced this (e.g. "slither", "semgrep", "ast"). */
  tool:         string;
  /** Specific detector / rule that fired (e.g. "reentrancy-eth"). */
  detectorId:   string;
  /** Human-readable title. */
  title:        string;
  /** Severity as the tool reports it — normalized downstream. */
  severity:     string;
  /** File within the uploaded source tree. */
  file:         string;
  lineStart:    number;
  lineEnd:      number;
  /** Exact lines of source for context in the report. */
  codeSnippet:  string;
  /** Prose description — will be augmented by AI layer, not replaced. */
  description:  string;
  /** SWC registry ID (e.g. "SWC-107"). "SWC-000" if unmapped. */
  swcId:        string;
  /** Tool's own confidence assessment (e.g. Slither's High/Medium/Low). */
  toolConfidence?: string;
  /** Raw tool output for debugging and full transparency. */
  rawOutput?:   string;
  /** Mythril / Echidna specific — execution trace / counterexample. */
  executionTrace?: string;
}

// ── Analysis result returned by an analyzer ──────────────────────────────────

export interface AnalysisResult {
  success:      boolean;
  findings:     RawAnalyzerFinding[];
  /** Compiler version actually used. */
  solcVersion?: string;
  /** Wall-clock time of this analysis in milliseconds. */
  durationMs:   number;
  /** Non-fatal warnings (e.g. "solc 0.7.0 fallback used"). */
  warnings:     string[];
  /** Fatal error message if success=false. */
  error?:       string;
}

// ── Analyzer metadata ─────────────────────────────────────────────────────────

export interface ToolInfo {
  name:    string;
  version: string;
}

export interface AnalyzerMetadata {
  /** Unique identifier — used as the tool name in ToolDetection records. */
  id:           string;
  /** Display name. */
  name:         string;
  /** SemVer of this analyzer plugin. */
  version:      string;
  chain:        ChainFamily;
  capabilities: AnalyzerCapability[];
  tools:        ToolInfo[];
  /**
   * Base evidence weight contributed to confidence scoring.
   * echidna=50, mythril=40, slither=35, semgrep=20, ast=25, groq=15
   */
  evidenceWeight: number;
}

// ── The plugin contract ───────────────────────────────────────────────────────

export interface Analyzer {
  readonly metadata: AnalyzerMetadata;

  /**
   * Called once before the first analyze() call.
   * Use to warm up connections, check tool availability, load rule sets.
   * Must resolve within 5 seconds or the loader will skip this analyzer.
   */
  prepare(context: AnalysisContext): Promise<void>;

  /**
   * Run the analysis. Must be safe to call concurrently across multiple jobs.
   * Must never throw — return success:false with error message instead.
   */
  analyze(contract: ContractInput): Promise<AnalysisResult>;

  /**
   * Called when the worker is shutting down gracefully.
   * Release resources, close sockets, etc.
   */
  cleanup(): Promise<void>;
}

export interface AnalysisContext {
  /** URL of a sidecar service (e.g. Slither FastAPI). Null for in-process analyzers. */
  serviceUrl?:  string;
  /** Timeout in milliseconds for this analysis pass. */
  timeoutMs:    number;
  /** Logger instance bound to this analysis job. */
  logger:       ContextLogger;
  /** Feature flags from the plan (e.g. symbolic_execution: true). */
  features:     Record<string, boolean>;
}

export interface ContextLogger {
  info(obj: object | string, msg?: string): void;
  warn(obj: object | string, msg?: string): void;
  error(obj: object | string, msg?: string): void;
  debug(obj: object | string, msg?: string): void;
}
