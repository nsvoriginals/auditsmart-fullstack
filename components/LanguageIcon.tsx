// components/LanguageIcon.tsx
// SVG icons for smart-contract languages. Paths are simplified versions of
// official brand logos / well-recognized shapes.

import React from "react";
import { FileCode } from "lucide-react";
import type { ContractLanguage } from "@/lib/contract-language";

interface Props {
  language: ContractLanguage;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function LanguageIcon({ language, size = 20, className, style }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className,
    style,
    "aria-hidden": true as const,
  };

  switch (language) {
    case "solidity":
      // Official Solidity diamond logo — three stacked rhombuses
      return (
        <svg {...common}>
          <path opacity="0.45" d="M11.99 4.76L8.61 10.6h6.78L11.99 4.76z" />
          <path d="M8.61 10.6L12 16.45l3.39-5.85H8.61z" />
          <path opacity="0.45" d="M4.41 7.64L8.61 10.6L11.99 4.76L7.79 0L4.41 7.64z" />
          <path opacity="0.85" d="M19.59 16.36l-4.2-2.96L12 19.24l4.2 4.76l3.39-7.64z" />
          <path d="M15.39 13.4l4.2 2.96L24 8.72l-4.2-2.96l-4.41 7.64z" />
          <path opacity="0.85" d="M8.61 10.6L4.41 7.64L0 15.28l4.2 2.96l4.41-7.64z" />
        </svg>
      );

    case "vyper":
      // Vyper — snake/V shape (lightning V)
      return (
        <svg {...common}>
          <path d="M3.5 3l8.5 18 8.5-18h-4l-4.5 10L7.5 3z" />
          <circle cx="8" cy="6.5" r="0.9" opacity="0.7" />
        </svg>
      );

    case "rust":
      // Rust — gear with a centered R
      return (
        <svg {...common}>
          <path d="M12 1.5l1.6 2.1 2.6-.6 1 2.4 2.6.6.1 2.6 2.1 1.5-1.1 2.4 1.1 2.4-2.1 1.5-.1 2.6-2.6.6-1 2.4-2.6-.6L12 22.5l-1.6-2.1-2.6.6-1-2.4-2.6-.6-.1-2.6-2.1-1.5 1.1-2.4-1.1-2.4 2.1-1.5.1-2.6 2.6-.6 1-2.4 2.6.6L12 1.5zM12 5a7 7 0 100 14 7 7 0 000-14z"/>
          <text x="12" y="15.5" fontSize="8" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="ui-monospace,monospace">R</text>
        </svg>
      );

    case "move":
      // Move (Aptos/Sui) — stacked blocks
      return (
        <svg {...common}>
          <path d="M3 4h8v8H3V4zm10 0h8v8h-8V4zM3 14h8v8H3v-8zm10 0h8v8h-8v-8z" opacity="0.6"/>
          <path d="M3 4h8v8H3V4z"/>
        </svg>
      );

    case "cairo":
      // Cairo (StarkNet) — sharp triangle/pyramid
      return (
        <svg {...common}>
          <path d="M12 2L2 21h20L12 2zm0 5l6 11H6l6-11z"/>
        </svg>
      );

    case "clarity":
      // Clarity (Stacks) — geometric C
      return (
        <svg {...common}>
          <path d="M3 4l3 8-3 8h4l2-5h5l2 5h4l-3-8 3-8h-4l-2 5H9L7 4H3zm6 9l1.5-3.5L12 13H9z"/>
        </svg>
      );

    default:
      return <FileCode size={size} className={className} style={style} />;
  }
}
