// Canonical Slither detector → SWC-ID + severity mapping.
// When Slither reports a finding, look up the detector name here to get the
// SWC classification used throughout the rest of the pipeline.

export interface SlitherDetectorMeta {
  swcId:    string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title:    string;
}

export const SLITHER_DETECTOR_MAP: Record<string, SlitherDetectorMeta> = {
  // ── Reentrancy ────────────────────────────────────────────────────────────
  'reentrancy-eth':            { swcId: 'SWC-107', severity: 'high',     title: 'Reentrancy (ETH)' },
  'reentrancy-no-eth':         { swcId: 'SWC-107', severity: 'medium',   title: 'Reentrancy (non-ETH)' },
  'reentrancy-benign':         { swcId: 'SWC-107', severity: 'low',      title: 'Reentrancy (benign)' },
  'reentrancy-unlimited-gas':  { swcId: 'SWC-107', severity: 'medium',   title: 'Reentrancy (unlimited gas)' },
  'delegatecall-loop':         { swcId: 'SWC-107', severity: 'medium',   title: 'Reentrancy via delegatecall loop' },

  // ── Authentication / Access Control ──────────────────────────────────────
  'tx-origin':                 { swcId: 'SWC-115', severity: 'medium',   title: 'tx.origin Authentication' },
  'suicidal':                  { swcId: 'SWC-106', severity: 'high',     title: 'Unprotected SELFDESTRUCT' },
  'arbitrary-send-eth':        { swcId: 'SWC-105', severity: 'high',     title: 'Arbitrary ETH Send' },
  'arbitrary-send-erc20':      { swcId: 'SWC-105', severity: 'high',     title: 'Arbitrary ERC20 Transfer' },
  'controlled-delegatecall':   { swcId: 'SWC-112', severity: 'high',     title: 'Controlled Delegatecall' },
  'unprotected-upgrade':       { swcId: 'SWC-112', severity: 'high',     title: 'Unprotected Upgrade Function' },
  'missing-zero-check':        { swcId: 'SWC-131', severity: 'low',      title: 'Missing Zero-Address Check' },

  // ── Unchecked Return Values ───────────────────────────────────────────────
  'unchecked-lowlevel':        { swcId: 'SWC-104', severity: 'medium',   title: 'Unchecked Low-Level Call' },
  'unchecked-send':            { swcId: 'SWC-104', severity: 'medium',   title: 'Unchecked send()' },
  'unchecked-transfer':        { swcId: 'SWC-104', severity: 'medium',   title: 'Unchecked ERC20 transfer()' },
  'unused-return':             { swcId: 'SWC-104', severity: 'medium',   title: 'Unused Return Value' },
  'low-level-calls':           { swcId: 'SWC-104', severity: 'info',     title: 'Low-Level Call Used' },

  // ── DoS / Gas ─────────────────────────────────────────────────────────────
  'calls-loop':                { swcId: 'SWC-113', severity: 'medium',   title: 'Calls Inside Loop' },
  'msg-value-loop':            { swcId: 'SWC-113', severity: 'high',     title: 'msg.value Used Inside Loop' },
  'locked-ether':              { swcId: 'SWC-132', severity: 'medium',   title: 'Locked Ether' },

  // ── Arithmetic ────────────────────────────────────────────────────────────
  'divide-before-multiply':    { swcId: 'SWC-101', severity: 'medium',   title: 'Division Before Multiplication' },

  // ── Randomness ────────────────────────────────────────────────────────────
  'weak-prng':                 { swcId: 'SWC-120', severity: 'high',     title: 'Weak Pseudo-Random Number Generator' },
  'timestamp':                 { swcId: 'SWC-116', severity: 'low',      title: 'Block Timestamp Dependency' },

  // ── Shadowing ─────────────────────────────────────────────────────────────
  'shadowing-local':           { swcId: 'SWC-119', severity: 'low',      title: 'Local Variable Shadowing' },
  'shadowing-state':           { swcId: 'SWC-119', severity: 'medium',   title: 'State Variable Shadowing' },
  'shadowing-abstract':        { swcId: 'SWC-119', severity: 'medium',   title: 'Abstract Function Shadowing' },
  'shadowing-builtin':         { swcId: 'SWC-119', severity: 'medium',   title: 'Built-in Symbol Shadowing' },

  // ── Uninitialized Variables ───────────────────────────────────────────────
  'uninitialized-local':       { swcId: 'SWC-109', severity: 'medium',   title: 'Uninitialized Local Variable' },
  'uninitialized-state':       { swcId: 'SWC-109', severity: 'high',     title: 'Uninitialized State Variable' },
  'uninitialized-storage':     { swcId: 'SWC-109', severity: 'high',     title: 'Uninitialized Storage Pointer' },

  // ── ABI / Encoding ────────────────────────────────────────────────────────
  'encode-packed-collision':   { swcId: 'SWC-133', severity: 'high',     title: 'ABI encodePacked Collision' },
  'abiencoderv2-array':        { swcId: 'SWC-000', severity: 'high',     title: 'ABIEncoderV2 Array Bug' },
  'array-by-reference':        { swcId: 'SWC-000', severity: 'medium',   title: 'Array Passed By Reference' },
  'storage-array':             { swcId: 'SWC-000', severity: 'medium',   title: 'Storage Array Modification' },

  // ── Logic / Correctness ───────────────────────────────────────────────────
  'tautology':                 { swcId: 'SWC-129', severity: 'medium',   title: 'Tautological Condition' },
  'incorrect-equality':        { swcId: 'SWC-132', severity: 'medium',   title: 'Incorrect Strict Equality' },
  'constant-function-changing-state': { swcId: 'SWC-134', severity: 'high', title: 'Constant Function Changes State' },
  'write-after-write':         { swcId: 'SWC-133', severity: 'medium',   title: 'Overwritten Write' },
  'boolean-equality':          { swcId: 'SWC-000', severity: 'info',     title: 'Boolean Equality Comparison' },

  // ── Assembly / Low-Level ──────────────────────────────────────────────────
  'assembly':                  { swcId: 'SWC-111', severity: 'info',     title: 'Inline Assembly Usage' },

  // ── Events ───────────────────────────────────────────────────────────────
  'events-maths':              { swcId: 'SWC-000', severity: 'low',      title: 'Missing Events for Math Operations' },
  'events-access':             { swcId: 'SWC-000', severity: 'low',      title: 'Missing Events for Access Control' },

  // ── ERC Standards ────────────────────────────────────────────────────────
  'erc20-interface':           { swcId: 'SWC-000', severity: 'medium',   title: 'Incorrect ERC20 Interface' },
  'erc721-interface':          { swcId: 'SWC-000', severity: 'medium',   title: 'Incorrect ERC721 Interface' },

  // ── Misc ──────────────────────────────────────────────────────────────────
  'name-reused':               { swcId: 'SWC-000', severity: 'medium',   title: 'Contract Name Reused' },
  'missing-inheritance':       { swcId: 'SWC-000', severity: 'info',     title: 'Missing Inheritance' },
  'redundant-statements':      { swcId: 'SWC-000', severity: 'info',     title: 'Redundant Statement' },
  'variable-scope':            { swcId: 'SWC-000', severity: 'low',      title: 'Variable Scope Issue' },
  'protected-vars':            { swcId: 'SWC-000', severity: 'medium',   title: 'Protected Variable Modification' },
};

export function getSlitherMeta(detector: string): SlitherDetectorMeta {
  return SLITHER_DETECTOR_MAP[detector] ?? {
    swcId:    'SWC-000',
    severity: 'info',
    title:    detector.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}
