// lib/contract-language.ts
// Detect the smart-contract language from chain identifier and (optionally)
// the source code. Supports EVM (Solidity/Vyper), Solana (Rust), TON (FunC/Tact),
// Polkadot (ink!), Cosmos (CosmWasm/Rust), Bitcoin inscriptions (JSON),
// StarkNet (Cairo), Stacks (Clarity), Aptos/Sui (Move).

export type ContractLanguage =
  | "solidity"
  | "vyper"
  | "rust"
  | "func"             // TON FunC
  | "tact"             // TON Tact (transpiles to FunC)
  | "ink"              // Polkadot ink!
  | "cosmwasm"         // Cosmos Rust (CosmWasm)
  | "json-inscription" // Bitcoin BRC-20 / Runes / Ordinals inscription payloads
  | "move"
  | "cairo"
  | "clarity"
  | "unknown";

const CHAIN_TO_LANGUAGE: Record<string, ContractLanguage> = {
  // EVM
  ethereum:  "solidity",
  bsc:       "solidity",
  polygon:   "solidity",
  avalanche: "solidity",
  arbitrum:  "solidity",
  optimism:  "solidity",
  base:      "solidity",
  tron:      "solidity",

  // Non-EVM
  solana:    "rust",
  ton:       "func",
  polkadot:  "ink",
  cosmos:    "cosmwasm",
  bitcoin:   "json-inscription",

  // Forward-compatible
  aptos:     "move",
  sui:       "move",
  starknet:  "cairo",
  stacks:    "clarity",
};

export function detectLanguage(chain?: string, code?: string): ContractLanguage {
  if (code) {
    const trimmed = code.trim();

    // BRC-20 / Ordinals inscription JSON: `{"p":"brc-20",...}` or rune mint payload
    if (/^\s*\{[\s\S]*"p"\s*:\s*"(brc-?20|sns|runes?)"/i.test(trimmed))                return "json-inscription";

    // Solidity
    if (/pragma\s+solidity/i.test(code))                                                return "solidity";

    // Vyper
    if (/^\s*@(external|payable|view|pure|nonreentrant)/m.test(code))                   return "vyper";

    // ink! (Polkadot) — check BEFORE generic rust since it uses #[ink(...)]
    if (/#\[ink(::contract|\(storage\)|\(event\)|\(constructor\)|\(message\))/.test(code)) return "ink";

    // CosmWasm — entry_point macro or cosmwasm_std import
    if (/#\[cosmwasm_std::entry_point\]|use\s+cosmwasm_std::|#\[entry_point\]/.test(code)) return "cosmwasm";

    // Solana / Anchor — Anchor or raw SPL imports
    if (/use\s+anchor_lang|#\[program\]|#\[derive\(Accounts\)\]|use\s+spl_token/.test(code)) return "rust";

    // TON Tact — `contract Foo with` / `receive(` / `init(`
    if (/^\s*contract\s+\w+\s+with\s+|^\s*receive\s*\(|^\s*init\s*\(/m.test(code) &&
        !/pragma\s+solidity/i.test(code))                                               return "tact";

    // TON FunC — `() recv_internal`, `int op~load_uint(32)`, `;; comments`
    if (/\(\)\s+recv_internal|;;\s|cell\s+\w+\s*=|slice\s+\w+\s*=/.test(code))         return "func";

    // Move
    if (/^\s*module\s+\w+::|public\s+entry\s+fun|struct.*has\s+key/m.test(code))        return "move";

    // Cairo
    if (/^%lang\s+starknet|@view\s+func|@external\s+func/m.test(code))                  return "cairo";

    // Clarity
    if (/\(define-public|\(define-read-only|\(impl-trait/.test(code))                   return "clarity";
  }

  const chainKey = (chain ?? "").toLowerCase();
  return CHAIN_TO_LANGUAGE[chainKey] ?? "unknown";
}

export function languageLabel(lang: ContractLanguage): string {
  return ({
    solidity:           "Solidity",
    vyper:              "Vyper",
    rust:               "Rust",
    func:               "FunC",
    tact:               "Tact",
    ink:                "ink!",
    cosmwasm:           "CosmWasm",
    "json-inscription": "Inscription",
    move:               "Move",
    cairo:              "Cairo",
    clarity:            "Clarity",
    unknown:            "Contract",
  } as Record<ContractLanguage, string>)[lang];
}

export function languageColor(lang: ContractLanguage): { color: string; bg: string; border: string } {
  switch (lang) {
    case "solidity":           return { color: "#627EEA", bg: "rgba(98,126,234,0.10)",  border: "rgba(98,126,234,0.30)"  };
    case "vyper":              return { color: "#2980B9", bg: "rgba(41,128,185,0.10)",  border: "rgba(41,128,185,0.30)"  };
    case "rust":               return { color: "#DEA584", bg: "rgba(222,165,132,0.12)", border: "rgba(222,165,132,0.35)" };
    case "func":               return { color: "#0098EA", bg: "rgba(0,152,234,0.10)",   border: "rgba(0,152,234,0.30)"   };
    case "tact":               return { color: "#28A0F0", bg: "rgba(40,160,240,0.10)",  border: "rgba(40,160,240,0.30)"  };
    case "ink":                return { color: "#E6007A", bg: "rgba(230,0,122,0.10)",   border: "rgba(230,0,122,0.30)"   };
    case "cosmwasm":           return { color: "#2E3148", bg: "rgba(46,49,72,0.10)",    border: "rgba(46,49,72,0.30)"    };
    case "json-inscription":   return { color: "#F7931A", bg: "rgba(247,147,26,0.10)",  border: "rgba(247,147,26,0.30)"  };
    case "move":               return { color: "#4A90E2", bg: "rgba(74,144,226,0.10)",  border: "rgba(74,144,226,0.30)"  };
    case "cairo":              return { color: "#FF4F0A", bg: "rgba(255,79,10,0.10)",   border: "rgba(255,79,10,0.30)"   };
    case "clarity":            return { color: "#5546FF", bg: "rgba(85,70,255,0.10)",   border: "rgba(85,70,255,0.30)"   };
    default:                   return { color: "#10b981", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.30)"  };
  }
}

/** Markdown code-fence label used when sending source to LLMs. */
export function languageFence(lang: ContractLanguage): string {
  switch (lang) {
    case "solidity":         return "solidity";
    case "vyper":            return "python";
    case "rust":             return "rust";
    case "func":             return "func";
    case "tact":             return "tact";
    case "ink":              return "rust";
    case "cosmwasm":         return "rust";
    case "json-inscription": return "json";
    case "move":             return "move";
    case "cairo":            return "cairo";
    case "clarity":          return "lisp";
    default:                 return "";
  }
}

/** Short human descriptor used in LLM system prompts. */
export function languageDisplayName(lang: ContractLanguage): string {
  switch (lang) {
    case "solidity":         return "Solidity (EVM)";
    case "vyper":            return "Vyper (EVM)";
    case "rust":             return "Rust (Solana program)";
    case "func":             return "FunC (TON)";
    case "tact":             return "Tact (TON)";
    case "ink":              return "ink! (Polkadot/Substrate)";
    case "cosmwasm":         return "CosmWasm Rust (Cosmos)";
    case "json-inscription": return "JSON inscription (Bitcoin BRC-20 / Runes / Ordinals)";
    case "move":             return "Move (Aptos/Sui)";
    case "cairo":            return "Cairo (StarkNet)";
    case "clarity":          return "Clarity (Stacks)";
    default:                 return "smart contract";
  }
}
