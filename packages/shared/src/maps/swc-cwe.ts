// SWC Registry → CWE mapping with human-readable metadata.
// Used by the normalizer to populate cweIds[] and by the SARIF exporter.

export interface SwcMeta {
  title:       string;
  description: string;
  cweIds:      string[];   // e.g. ["CWE-362", "CWE-841"]
  owasp:       string[];   // e.g. ["A01:2021"]
}

export const SWC_META: Record<string, SwcMeta> = {
  'SWC-100': {
    title:       'Function Default Visibility',
    description: 'Functions without visibility specifier default to public, potentially allowing unintended access.',
    cweIds:      ['CWE-284'],
    owasp:       ['A01:2021'],
  },
  'SWC-101': {
    title:       'Integer Overflow and Underflow',
    description: 'Arithmetic operations that wrap around max/min integer bounds, enabling unexpected behavior.',
    cweIds:      ['CWE-190', 'CWE-191'],
    owasp:       ['A03:2021'],
  },
  'SWC-102': {
    title:       'Outdated Compiler Version',
    description: 'Using an old Solidity compiler version may miss important bug fixes and security patches.',
    cweIds:      ['CWE-937'],
    owasp:       ['A06:2021'],
  },
  'SWC-103': {
    title:       'Floating Pragma',
    description: 'Contracts should use a fixed compiler version to prevent deployment with a buggy compiler.',
    cweIds:      ['CWE-664'],
    owasp:       ['A06:2021'],
  },
  'SWC-104': {
    title:       'Unchecked Call Return Value',
    description: 'Return values of low-level calls are not checked, silently ignoring failed calls.',
    cweIds:      ['CWE-252', 'CWE-754'],
    owasp:       ['A09:2021'],
  },
  'SWC-105': {
    title:       'Unprotected Ether Withdrawal',
    description: 'Any user can withdraw Ether from the contract without authorization checks.',
    cweIds:      ['CWE-284'],
    owasp:       ['A01:2021'],
  },
  'SWC-106': {
    title:       'Unprotected SELFDESTRUCT Instruction',
    description: 'The SELFDESTRUCT opcode can be triggered by anyone, destroying the contract and draining funds.',
    cweIds:      ['CWE-284'],
    owasp:       ['A01:2021'],
  },
  'SWC-107': {
    title:       'Reentrancy',
    description: 'External call is made before state updates complete, allowing an attacker to re-enter and drain funds.',
    cweIds:      ['CWE-362', 'CWE-841'],
    owasp:       ['A04:2021'],
  },
  'SWC-108': {
    title:       'State Variable Default Visibility',
    description: 'State variables default to internal visibility; unintended public exposure may occur.',
    cweIds:      ['CWE-284'],
    owasp:       ['A01:2021'],
  },
  'SWC-109': {
    title:       'Uninitialized Storage Pointer',
    description: 'Uninitialized local storage pointers can point to arbitrary storage slots, corrupting state.',
    cweIds:      ['CWE-457'],
    owasp:       ['A03:2021'],
  },
  'SWC-110': {
    title:       'Assert Violation',
    description: 'Reachable assert() statements indicate invariant violations or logic bugs.',
    cweIds:      ['CWE-617'],
    owasp:       ['A03:2021'],
  },
  'SWC-111': {
    title:       'Use of Deprecated Solidity Functions',
    description: 'Deprecated functions like suicide(), throw, sha3() may behave unexpectedly.',
    cweIds:      ['CWE-477'],
    owasp:       ['A06:2021'],
  },
  'SWC-112': {
    title:       'Delegatecall to Untrusted Callee',
    description: 'delegatecall() to an externally controlled address can execute arbitrary code in the calling contract\'s context.',
    cweIds:      ['CWE-829'],
    owasp:       ['A08:2021'],
  },
  'SWC-113': {
    title:       'DoS with Failed Call',
    description: 'Calls that can be forced to fail allow an attacker to permanently block contract execution.',
    cweIds:      ['CWE-703', 'CWE-400'],
    owasp:       ['A05:2021'],
  },
  'SWC-114': {
    title:       'Transaction Order Dependence',
    description: 'Contract behavior depends on transaction ordering (front-running), which miners or MEV bots can exploit.',
    cweIds:      ['CWE-362'],
    owasp:       ['A04:2021'],
  },
  'SWC-115': {
    title:       'Authorization Through tx.origin',
    description: 'Using tx.origin for authorization is vulnerable to phishing attacks via malicious intermediary contracts.',
    cweIds:      ['CWE-290'],
    owasp:       ['A01:2021'],
  },
  'SWC-116': {
    title:       'Block Values as Proxy for Time',
    description: 'block.timestamp can be manipulated by miners within a range, making time-based logic exploitable.',
    cweIds:      ['CWE-829'],
    owasp:       ['A04:2021'],
  },
  'SWC-117': {
    title:       'Signature Malleability',
    description: 'ECDSA signatures can be transformed into valid alternative forms, potentially bypassing signature checks.',
    cweIds:      ['CWE-347'],
    owasp:       ['A02:2021'],
  },
  'SWC-118': {
    title:       'Incorrect Constructor Name',
    description: 'Old-style constructors using function name matching can be called by anyone if the name is misspelled.',
    cweIds:      ['CWE-284'],
    owasp:       ['A01:2021'],
  },
  'SWC-119': {
    title:       'Shadowing State Variables',
    description: 'Local variables that shadow state variables cause unexpected behavior when the wrong scope is modified.',
    cweIds:      ['CWE-1001'],
    owasp:       ['A03:2021'],
  },
  'SWC-120': {
    title:       'Weak Sources of Randomness from Chain Attributes',
    description: 'Block hash, timestamp, and other on-chain values are predictable or manipulable by miners.',
    cweIds:      ['CWE-338'],
    owasp:       ['A02:2021'],
  },
  'SWC-121': {
    title:       'Missing Protection Against Signature Replay Attacks',
    description: 'Signed messages can be replayed to repeat previously authorized operations.',
    cweIds:      ['CWE-294'],
    owasp:       ['A02:2021'],
  },
  'SWC-122': {
    title:       'Lack of Proper Signature Verification',
    description: 'Signature verification is incomplete or incorrect, allowing unsigned operations.',
    cweIds:      ['CWE-347'],
    owasp:       ['A02:2021'],
  },
  'SWC-123': {
    title:       'Requirement Violation',
    description: 'Reachable require() conditions indicate incorrect assumptions about inputs or state.',
    cweIds:      ['CWE-617'],
    owasp:       ['A03:2021'],
  },
  'SWC-124': {
    title:       'Write to Arbitrary Storage Location',
    description: 'Untrusted input can write to arbitrary storage slots, allowing state corruption.',
    cweIds:      ['CWE-123'],
    owasp:       ['A03:2021'],
  },
  'SWC-125': {
    title:       'Incorrect Inheritance Order',
    description: 'Wrong C3 linearization order causes the wrong function implementation to be called.',
    cweIds:      ['CWE-696'],
    owasp:       ['A03:2021'],
  },
  'SWC-126': {
    title:       'Insufficient Gas Griefing',
    description: 'Insufficient gas forwarded to sub-calls can cause silent failures in called contracts.',
    cweIds:      ['CWE-400'],
    owasp:       ['A05:2021'],
  },
  'SWC-127': {
    title:       'Arbitrary Jump with Function Type Variable',
    description: 'Function type variables can be manipulated to jump to arbitrary code locations.',
    cweIds:      ['CWE-695'],
    owasp:       ['A03:2021'],
  },
  'SWC-128': {
    title:       'DoS With Block Gas Limit',
    description: 'Unbounded loops or large data structures can exceed block gas limits, causing permanent DoS.',
    cweIds:      ['CWE-400'],
    owasp:       ['A05:2021'],
  },
  'SWC-129': {
    title:       'Typographical Error',
    description: 'Tautologies, contradictions, or off-by-one errors make conditions always true or always false.',
    cweIds:      ['CWE-570', 'CWE-571'],
    owasp:       ['A03:2021'],
  },
  'SWC-130': {
    title:       'Right-To-Left-Override Control Character in Source Code',
    description: 'Bidirectional unicode control characters can disguise malicious code as comments.',
    cweIds:      ['CWE-116'],
    owasp:       ['A03:2021'],
  },
  'SWC-131': {
    title:       'Presence of Unused Variables',
    description: 'Zero-address checks missing before assigning critical addresses can lock or lose funds.',
    cweIds:      ['CWE-20'],
    owasp:       ['A03:2021'],
  },
  'SWC-132': {
    title:       'Unexpected Ether Balance',
    description: 'Relying on exact contract balance for logic is exploitable via forced Ether sends.',
    cweIds:      ['CWE-400'],
    owasp:       ['A03:2021'],
  },
  'SWC-133': {
    title:       'Hash Collisions With Multiple Variable Length Arguments',
    description: 'abi.encodePacked() with multiple variable-length arguments can produce hash collisions.',
    cweIds:      ['CWE-328'],
    owasp:       ['A02:2021'],
  },
  'SWC-134': {
    title:       'Message Call with Hardcoded Gas Amount',
    description: 'Hardcoded gas in transfer() or send() breaks if opcodes change gas costs in future upgrades.',
    cweIds:      ['CWE-672'],
    owasp:       ['A03:2021'],
  },
  'SWC-135': {
    title:       'Code With No Effects',
    description: 'Code that has no effect on contract state or execution may indicate a logic error.',
    cweIds:      ['CWE-561'],
    owasp:       ['A03:2021'],
  },
  'SWC-136': {
    title:       'Unencrypted Private Data On-Chain',
    description: 'Data marked private in Solidity is still visible on-chain; should never store real secrets.',
    cweIds:      ['CWE-312'],
    owasp:       ['A02:2021'],
  },
  'SWC-000': {
    title:       'Uncategorized Finding',
    description: 'Finding does not map directly to a SWC entry.',
    cweIds:      [],
    owasp:       [],
  },
};

const UNCATEGORIZED_SWC: SwcMeta = SWC_META['SWC-000'] ?? {
  title:       'Uncategorized Finding',
  description: 'Finding does not map directly to a SWC entry.',
  cweIds:      [],
  owasp:       [],
};

export function getSwcMeta(swcId: string): SwcMeta {
  return SWC_META[swcId] ?? UNCATEGORIZED_SWC;
}

export function swcToCweIds(swcId: string): string[] {
  return getSwcMeta(swcId).cweIds;
}
