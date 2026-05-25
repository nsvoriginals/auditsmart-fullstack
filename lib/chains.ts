// lib/chains.ts
// Single source of truth for every supported blockchain.
// UI dropdowns, address validators, language detection, and API validation
// all read from this. Adding a chain = adding one entry here + entries in
// lib/standards.ts.

import type { ContractLanguage } from "./contract-language";

export type ChainId =
  // EVM family
  | "ethereum" | "bsc" | "polygon" | "avalanche" | "arbitrum" | "optimism" | "base"
  // Non-EVM
  | "ton" | "solana" | "bitcoin" | "tron" | "cosmos" | "polkadot";

export interface ChainConfig {
  id: ChainId;
  label: string;
  /** Primary contract language for this chain (used by agent prompt selection). */
  language: ContractLanguage;
  /** Regex an address must match to be considered valid for this chain. */
  addressRegex: RegExp;
  /** Human-readable placeholder address to show in inputs. */
  addressExample: string;
  /** Prisma ChainType enum value (uppercase). */
  enumValue:
    | "ETHEREUM" | "BSC" | "POLYGON" | "AVALANCHE" | "ARBITRUM" | "OPTIMISM" | "BASE"
    | "TON" | "SOLANA" | "BITCOIN" | "TRON" | "COSMOS" | "POLKADOT";
  /** Standard IDs available on this chain — actual configs live in lib/standards.ts. */
  standards: string[];
  /** Code-fence label for Markdown blocks sent to LLMs. */
  codeFence: string;
}

export const CHAINS: ChainConfig[] = [
  // ─── EVM ─────────────────────────────────────────────────────────────
  {
    id: "ethereum",
    label: "Ethereum",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x742d35Cc6634C0532925a3b8D4C9C5f2...",
    enumValue: "ETHEREUM",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },
  {
    id: "bsc",
    label: "BNB Chain",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x...",
    enumValue: "BSC",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },
  {
    id: "polygon",
    label: "Polygon",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x...",
    enumValue: "POLYGON",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },
  {
    id: "avalanche",
    label: "Avalanche",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x...",
    enumValue: "AVALANCHE",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },
  {
    id: "arbitrum",
    label: "Arbitrum",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x...",
    enumValue: "ARBITRUM",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },
  {
    id: "optimism",
    label: "Optimism",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x...",
    enumValue: "OPTIMISM",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },
  {
    id: "base",
    label: "Base",
    language: "solidity",
    addressRegex: /^0x[0-9a-fA-F]{40}$/,
    addressExample: "0x...",
    enumValue: "BASE",
    standards: ["erc20", "erc721", "erc1155", "erc4626", "erc1967", "erc1271"],
    codeFence: "solidity",
  },

  // ─── Non-EVM ─────────────────────────────────────────────────────────

  // TON — Jetton (TEP-74) and NFT (TEP-62) standards on FunC/Tact.
  // Addresses: EQ.../UQ... base64url, 48 chars including checksum.
  {
    id: "ton",
    label: "TON",
    language: "func",
    addressRegex: /^[EU]Q[A-Za-z0-9_-]{46}$/,
    addressExample: "EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbdLIYI",
    enumValue: "TON",
    standards: ["tep74", "tep62"],
    codeFence: "func",
  },

  // Solana — SPL Token (fungible) and Metaplex (NFT). Rust programs.
  // Addresses: 32-44 char base58 (no 0/O/I/l).
  {
    id: "solana",
    label: "Solana",
    language: "rust",
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    addressExample: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    enumValue: "SOLANA",
    standards: ["spl", "metaplex"],
    codeFence: "rust",
  },

  // Bitcoin — BRC-20, Runes, Ordinals are inscription standards.
  // Addresses: bech32 (bc1q.../bc1p...) or legacy 1.../3...
  {
    id: "bitcoin",
    label: "Bitcoin",
    language: "json-inscription",
    addressRegex: /^(bc1[a-z0-9]{6,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
    addressExample: "bc1pxwww0ct9ue7e8tdnlmug5m2tamfn7q06sahstg39ys4c9f3340q...",
    enumValue: "BITCOIN",
    standards: ["brc20", "runes", "ordinals"],
    codeFence: "json",
  },

  // TRON — TVM (Solidity-flavored). TRC-20 (fungible) and TRC-721 (NFT).
  // Addresses: T-prefixed base58, 34 chars.
  {
    id: "tron",
    label: "TRON",
    language: "solidity",
    addressRegex: /^T[A-Za-z1-9]{33}$/,
    addressExample: "TRX9Z6X1qNzL3aLrhJk2nB8YbHXM2P1c5T",
    enumValue: "TRON",
    standards: ["trc20", "trc721"],
    codeFence: "solidity",
  },

  // Cosmos — IBC and ICS standards. CosmWasm (Rust) contracts.
  // Addresses: bech32, prefix varies by chain (cosmos1.../osmo1.../etc.).
  {
    id: "cosmos",
    label: "Cosmos",
    language: "cosmwasm",
    addressRegex: /^[a-z]{2,10}1[a-z0-9]{38,58}$/,
    addressExample: "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6",
    enumValue: "COSMOS",
    standards: ["ibc", "ics"],
    codeFence: "rust",
  },

  // Polkadot — XCM (Cross-Consensus Messaging) and PSP (Polkadot Standards).
  // ink! (Rust) smart contracts. Addresses: SS58, 47-48 chars.
  {
    id: "polkadot",
    label: "Polkadot",
    language: "ink",
    addressRegex: /^[1-9A-HJ-NP-Za-km-z]{46,48}$/,
    addressExample: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    enumValue: "POLKADOT",
    standards: ["xcm", "psp"],
    codeFence: "rust",
  },
];

const CHAIN_BY_ID = new Map(CHAINS.map(c => [c.id, c]));

export function getChain(id: string | null | undefined): ChainConfig | undefined {
  if (!id) return undefined;
  return CHAIN_BY_ID.get(id.toLowerCase() as ChainId);
}

/** Validate a chain id and return its config; throws if unknown. */
export function requireChain(id: string): ChainConfig {
  const c = getChain(id);
  if (!c) throw new Error(`Unknown chain: ${id}`);
  return c;
}

/** Map a (possibly user-supplied) chain string to a Prisma ChainType enum value. */
export function toChainEnum(id: string): ChainConfig["enumValue"] | null {
  return getChain(id)?.enumValue ?? null;
}

/** Is the chain part of the EVM family (Solidity, 0x addresses)? */
export function isEvmChain(id: string): boolean {
  const c = getChain(id);
  return c?.language === "solidity" && c.addressRegex.source.startsWith("^0x");
}
