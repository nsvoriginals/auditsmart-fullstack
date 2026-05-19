// components/ChainIcon.tsx
// Inline SVG icons for every supported (and forward-compatible) blockchain.
// Paths are simplified versions of each chain's brand mark, rendered in
// `currentColor` so the parent's `color` style tints them.

import React from "react";

export type ChainKey =
  | "ethereum" | "bsc" | "polygon" | "avalanche" | "arbitrum"
  | "optimism" | "base"
  | "solana" | "bitcoin" | "sui" | "aptos" | "starknet" | "stacks"
  | "near" | "ton" | "tron" | "cosmos"
  | "unknown";

interface Props {
  chain: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const NORMALIZE: Record<string, ChainKey> = {
  ethereum: "ethereum", eth: "ethereum", mainnet: "ethereum",
  bsc: "bsc", binance: "bsc", bnb: "bsc", binance_smart_chain: "bsc",
  polygon: "polygon", matic: "polygon",
  avalanche: "avalanche", avax: "avalanche",
  arbitrum: "arbitrum", arb: "arbitrum",
  optimism: "optimism", op: "optimism",
  base: "base",
  solana: "solana", sol: "solana",
  bitcoin: "bitcoin", btc: "bitcoin",
  sui: "sui",
  aptos: "aptos", apt: "aptos",
  starknet: "starknet", stark: "starknet",
  stacks: "stacks", stx: "stacks",
  near: "near",
  ton: "ton",
  tron: "tron", trx: "tron",
  cosmos: "cosmos", atom: "cosmos",
};

export function normalizeChain(raw: string): ChainKey {
  return NORMALIZE[String(raw ?? "").toLowerCase().trim()] ?? "unknown";
}

export function chainLabel(raw: string): string {
  const key = normalizeChain(raw);
  return {
    ethereum: "Ethereum", bsc: "BSC", polygon: "Polygon",
    avalanche: "Avalanche", arbitrum: "Arbitrum", optimism: "Optimism",
    base: "Base", solana: "Solana", bitcoin: "Bitcoin",
    sui: "Sui", aptos: "Aptos", starknet: "StarkNet", stacks: "Stacks",
    near: "NEAR", ton: "TON", tron: "TRON", cosmos: "Cosmos",
    unknown: raw || "Unknown",
  }[key];
}

export function chainColor(raw: string): { color: string; bg: string; border: string } {
  const key = normalizeChain(raw);
  const palette: Record<ChainKey, string> = {
    ethereum:  "#627EEA",
    bsc:       "#F0B90B",
    polygon:   "#8247E5",
    avalanche: "#E84142",
    arbitrum:  "#28A0F0",
    optimism:  "#FF0420",
    base:      "#0052FF",
    solana:    "#9945FF",
    bitcoin:   "#F7931A",
    sui:       "#4DA2FF",
    aptos:     "#06A77D",
    starknet:  "#FF4F0A",
    stacks:    "#5546FF",
    near:      "#000000",
    ton:       "#0098EA",
    tron:      "#FF060A",
    cosmos:    "#5064FB",
    unknown:   "#10b981",
  };
  const hex = palette[key];
  // Convert hex → rgb to build matching bg/border tints
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    color:  hex,
    bg:     `rgba(${r},${g},${b},0.10)`,
    border: `rgba(${r},${g},${b},0.30)`,
  };
}

export function ChainIcon({ chain, size = 22, className, style }: Props) {
  const key = normalizeChain(chain);
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    className, style, "aria-hidden": true as const,
  };

  switch (key) {
    case "ethereum":
      // Classic Ethereum diamond — two faceted halves
      return (
        <svg {...common}>
          <path fill="currentColor" d="M11.94 0L11.78.55v15.97l.16.16 7.4-4.37L11.94 0z"/>
          <path fill="currentColor" opacity="0.55" d="M11.94 0L4.55 12.31l7.39 4.37V0z"/>
          <path fill="currentColor" d="M11.94 18.09l-.09.11v5.7l.09.27 7.4-10.42-7.4 4.34z"/>
          <path fill="currentColor" opacity="0.55" d="M11.94 24.17v-6.08L4.55 13.75l7.39 10.42z"/>
          <path fill="currentColor" opacity="0.85" d="M11.94 16.68l7.4-4.37-7.4-3.36v7.73z"/>
          <path fill="currentColor" opacity="0.4"  d="M4.55 12.31l7.39 4.37V8.95L4.55 12.31z"/>
        </svg>
      );

    case "solana":
      // Three slanted parallelogram bars
      return (
        <svg {...common}>
          <path fill="currentColor" d="M4.5 18.4l2.4-2.4h12.6l-2.4 2.4H4.5z"/>
          <path fill="currentColor" d="M4.5 13l2.4-2.4h12.6L17.1 13H4.5z"/>
          <path fill="currentColor" d="M4.5 7.6l2.4-2.4h12.6l-2.4 2.4H4.5z"/>
        </svg>
      );

    case "bitcoin":
      // Circle with ₿
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M15.4 10.6c.2-1.5-.9-2.3-2.4-2.8l.5-2-1.2-.3-.5 2c-.3-.1-.6-.2-1-.2l.5-2-1.2-.3-.5 2c-.2-.1-.5-.1-.7-.2l-1.7-.4-.3 1.3s.9.2.9.2c.5.1.6.5.6.7l-.6 2.4c0 .1 0 .1.1.1l-.1-.1-.8 3.3c-.1.2-.3.4-.6.3 0 0-.9-.2-.9-.2l-.6 1.4 1.6.4c.3.1.6.2.9.2l-.5 2 1.2.3.5-2c.3.1.6.2 1 .2l-.5 2 1.2.3.5-2c2 .4 3.6.2 4.3-1.6.5-1.5-.1-2.3-1.1-2.9.8-.2 1.3-.7 1.5-1.7zm-2.6 3.8c-.4 1.5-2.9.7-3.7.5l.7-2.7c.8.2 3.4.6 3 2.2zm.4-3.8c-.3 1.4-2.5.7-3.1.5l.6-2.4c.7.2 2.9.6 2.5 1.9z"/>
        </svg>
      );

    case "polygon":
      // Polygon's iconic hexagonal mark
      return (
        <svg {...common}>
          <path fill="currentColor" d="M16.6 8.4l-3.7-2.1c-.4-.2-.9-.2-1.3 0l-3.7 2.1c-.4.2-.6.7-.6 1.1v4.2l-2.7 1.5-2.7-1.5V11l2.7-1.5 1.8 1V8.4l-1.1-.7c-.2-.1-.4-.1-.6 0l-3.7 2.1c-.2.1-.3.3-.3.6v4.2c0 .2.1.4.3.5l3.7 2.1c.2.1.4.1.6 0l3.7-2.1c.2-.1.3-.3.3-.6v-4.2l.1-.1L13.4 9l2.7 1.5v3l-2.7 1.5-1.8-1v1.6l1.1.7c.2.1.4.1.6 0l3.7-2.1c.2-.1.3-.3.3-.5V9.5c0-.4-.2-.9-.7-1.1z"/>
        </svg>
      );

    case "bsc":
      // BNB diamond/star
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M12 4.8l1.95 2-4.9 4.9L7 9.75 12 4.8zm4.95 4.95l1.95 2L12 18.7l-6.9-6.95 1.95-2L12 14.65l4.95-4.9zm-9.9 2L9 13.7l-1.95 1.95L5.1 13.7l1.95-1.95zm9.9 0l1.95 1.95L17 15.65l-1.95-1.95 1.9-1.95zM12 10.7l1.95 2L12 14.65 10.05 12.7 12 10.7z"/>
        </svg>
      );

    case "avalanche":
      // Red triangle in circle
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M12 5.5l6 10.5h-3.5l-1-2h-3l-1 2H6L12 5.5zm0 4.2l-1.1 2.3h2.2L12 9.7z"/>
        </svg>
      );

    case "arbitrum":
      // Arbitrum "A"
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M8 17l4-10 1.5 4-2.5 6H8zm5-7l3 7h2.5l-4-9.5L13 10z"/>
        </svg>
      );

    case "optimism":
      // Red circle with stylized OP
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <ellipse cx="9.5" cy="12.5" rx="2.6" ry="2.6" fill="none" stroke="#fff" strokeWidth="1.4"/>
          <path fill="#fff" d="M13.6 9.7h2.6c1.4 0 2.2.7 2.2 1.8 0 1.1-.8 1.8-2.2 1.8h-1.4v2H13.6V9.7zm1.2 1v1.6h1.3c.5 0 .8-.3.8-.8s-.3-.8-.8-.8h-1.3z"/>
        </svg>
      );

    case "base":
      // Base's blue circle-with-bite mark (simplified)
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M11.5 5.5a6.5 6.5 0 100 13H22v-13H11.5z" transform="translate(-5,0)"/>
        </svg>
      );

    case "sui":
      // Water-drop
      return (
        <svg {...common}>
          <path fill="currentColor" d="M12 1.5C12 1.5 4 9.5 4 15a8 8 0 0016 0c0-5.5-8-13.5-8-13.5zm0 4.2c1.4 1.8 6 7.6 6 11a6 6 0 11-12 0c0-3.4 4.6-9.2 6-11z"/>
          <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.55"/>
        </svg>
      );

    case "aptos":
      // Aptos "A∞"
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M7 16l4-9h2l4 9h-2.2l-.85-2H10l-.85 2H7zm3.6-3.5h2.8L12 9.4l-1.4 3.1z"/>
        </svg>
      );

    case "starknet":
      // Sharp diamond with inner star
      return (
        <svg {...common}>
          <path fill="currentColor" d="M12 1.5L1.5 12 12 22.5 22.5 12 12 1.5zm0 4L18.5 12 12 18.5 5.5 12 12 5.5z"/>
          <path fill="currentColor" d="M12 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
        </svg>
      );

    case "stacks":
      // Stacks "≡" geometric
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M6 9h12v1.2H6V9zm0 4.8h12V15H6v-1.2zm2 2.2l4-2 4 2-4 2-4-2zm0-7l4 2 4-2-4-2-4 2z"/>
        </svg>
      );

    case "near":
      // NEAR "N"
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M7.5 6.5v11h1.7v-7l5.6 7h1.7v-11h-1.7v7l-5.6-7H7.5z"/>
        </svg>
      );

    case "ton":
      // TON diamond
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill="currentColor"/>
          <path fill="#fff" d="M6.5 9.2L12 19l5.5-9.8h-2.4L12 14.8 8.9 9.2H6.5zM6 7.2h12v1.6H6V7.2z"/>
        </svg>
      );

    case "tron":
      // TRON triangle
      return (
        <svg {...common}>
          <path fill="currentColor" d="M3 5l9 16 9-16-9 4-9-4zm2 1.6l7 3.1V18L5 6.6zm14 0L12 18V9.7l7-3.1z"/>
        </svg>
      );

    case "cosmos":
      // Cosmos atom — 3 ellipses
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(60 12 12)"/>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(-60 12 12)"/>
        </svg>
      );

    default:
      // Generic hex chip for unknown chains
      return (
        <svg {...common}>
          <path fill="currentColor" opacity="0.25" d="M12 2l8.7 5v10L12 22l-8.7-5V7L12 2z"/>
          <path fill="currentColor" d="M12 6.5l4.5 2.6v5.2L12 17l-4.5-2.7V9.1L12 6.5z"/>
        </svg>
      );
  }
}
