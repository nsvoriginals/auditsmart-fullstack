// lib/contract-language.ts
// Detect the smart-contract language from chain identifier and (optionally)
// the source code. Currently all supported chains are EVM (Solidity), but the
// detector is forward-compatible for Solana/Aptos/Sui/StarkNet/Stacks.

export type ContractLanguage =
  | "solidity"
  | "vyper"
  | "rust"
  | "move"
  | "cairo"
  | "clarity"
  | "unknown";

const CHAIN_TO_LANGUAGE: Record<string, ContractLanguage> = {
  ethereum:  "solidity",
  bsc:       "solidity",
  polygon:   "solidity",
  avalanche: "solidity",
  arbitrum:  "solidity",
  optimism:  "solidity",
  base:      "solidity",
  solana:    "rust",
  aptos:     "move",
  sui:       "move",
  starknet:  "cairo",
  stacks:    "clarity",
};

export function detectLanguage(chain?: string, code?: string): ContractLanguage {
  if (code) {
    // Code-based detection (cheap regex checks, ordered most-specific first)
    if (/pragma\s+solidity/i.test(code))                                     return "solidity";
    if (/^\s*@(external|payable|view|pure|nonreentrant)/m.test(code))        return "vyper";
    if (/use\s+anchor_lang|#\[program\]|#\[derive\(Accounts\)\]/.test(code)) return "rust";
    if (/^\s*module\s+\w+::|public\s+entry\s+fun|struct.*has\s+key/m.test(code)) return "move";
    if (/^%lang\s+starknet|@view\s+func|@external\s+func/m.test(code))       return "cairo";
    if (/\(define-public|\(define-read-only|\(impl-trait/.test(code))        return "clarity";
  }
  const chainKey = (chain ?? "").toLowerCase();
  return CHAIN_TO_LANGUAGE[chainKey] ?? "unknown";
}

export function languageLabel(lang: ContractLanguage): string {
  return {
    solidity: "Solidity",
    vyper:    "Vyper",
    rust:     "Rust",
    move:     "Move",
    cairo:    "Cairo",
    clarity:  "Clarity",
    unknown:  "Contract",
  }[lang];
}

export function languageColor(lang: ContractLanguage): { color: string; bg: string; border: string } {
  switch (lang) {
    case "solidity": return { color: "#627EEA", bg: "rgba(98,126,234,0.10)",  border: "rgba(98,126,234,0.30)"  };
    case "vyper":    return { color: "#2980B9", bg: "rgba(41,128,185,0.10)",  border: "rgba(41,128,185,0.30)"  };
    case "rust":     return { color: "#DEA584", bg: "rgba(222,165,132,0.12)", border: "rgba(222,165,132,0.35)" };
    case "move":     return { color: "#4A90E2", bg: "rgba(74,144,226,0.10)",  border: "rgba(74,144,226,0.30)"  };
    case "cairo":    return { color: "#FF4F0A", bg: "rgba(255,79,10,0.10)",   border: "rgba(255,79,10,0.30)"   };
    case "clarity":  return { color: "#5546FF", bg: "rgba(85,70,255,0.10)",   border: "rgba(85,70,255,0.30)"   };
    default:         return { color: "#10b981", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.30)"  };
  }
}
