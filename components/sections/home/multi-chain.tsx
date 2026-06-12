"use client";
// components/sections/home/multi-chain.tsx — Multi-chain intelligence section

import { useState } from "react";
import { motion } from "framer-motion";
import { ease, dur } from "@/components/motion/config";
import { Reveal, HoverLift } from "@/components/motion/primitives";
import { Check, Clock, ArrowRight } from "lucide-react";

interface Chain {
  id: string;
  name: string;
  family: string;
  status: "live" | "beta" | "soon";
  description: string;
  tools: string[];
  color: string;
  gradient: string;
  contracts?: string;
  symbol: string;
}

const CHAINS: Chain[] = [
  {
    id: "evm",
    name: "EVM",
    family: "Ethereum Virtual Machine",
    status: "live",
    description: "Full support across all EVM-compatible networks. Slither, Semgrep, and all 10 AI agents active.",
    tools: ["Slither", "Semgrep", "AST", "Mythril", "Echidna", "All 10 AI Agents"],
    color: "#627EEA",
    gradient: "linear-gradient(135deg, #627EEA22, #00d4ff11)",
    contracts: "50M+",
    symbol: "⬡",
  },
  {
    id: "solana",
    name: "Solana",
    family: "Sealevel Runtime",
    status: "beta",
    description: "Rust-native analysis with account confusion and signer verification checks.",
    tools: ["AST (Rust)", "Pattern Match", "3 AI Agents"],
    color: "#9945FF",
    gradient: "linear-gradient(135deg, #9945FF22, #14F19511)",
    contracts: "2M+",
    symbol: "◎",
  },
  {
    id: "cosmwasm",
    name: "CosmWasm",
    family: "Cosmos Ecosystem",
    status: "beta",
    description: "Wasm bytecode analysis and inter-contract call verification for Cosmos chains.",
    tools: ["Wasm AST", "IBC Checks", "2 AI Agents"],
    color: "#6F4E7C",
    gradient: "linear-gradient(135deg, #6F4E7C22, #9945FF11)",
    contracts: "400K+",
    symbol: "⬡",
  },
  {
    id: "ink",
    name: "ink!",
    family: "Polkadot / Substrate",
    status: "soon",
    description: "Rust ink! smart contract analyzer for Substrate-based chains.",
    tools: ["AST (Rust)", "Ink Patterns"],
    color: "#E6007A",
    gradient: "linear-gradient(135deg, #E6007A22, #ffffff05)",
    symbol: "●",
  },
  {
    id: "ton",
    name: "TON",
    family: "The Open Network",
    status: "soon",
    description: "FunC and Tact contract analysis with TON-specific vulnerability patterns.",
    tools: ["FunC Parser", "Tact AST"],
    color: "#0098EA",
    gradient: "linear-gradient(135deg, #0098EA22, #ffffff05)",
    symbol: "◆",
  },
];

const STATUS_CONFIG = {
  live:  { label: "Live",  color: "#00ff88", bg: "#00ff8815" },
  beta:  { label: "Beta",  color: "#f59e0b", bg: "#f59e0b15" },
  soon:  { label: "Soon",  color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" },
};

export function MultiChain() {
  const [activeChain, setActiveChain] = useState<string>("evm");
  const active = CHAINS.find((c) => c.id === activeChain) ?? CHAINS[0];

  return (
    <section className="relative py-32 overflow-hidden" style={{ background: "var(--surface-1)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="mb-20">
          <Reveal>
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-4 block"
              style={{ color: "#a855f7", fontFamily: "var(--font-dm-mono)" }}
            >
              Multi-Chain
            </span>
          </Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <Reveal delay={0.1}>
              <h2
                className="text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
              >
                CHAIN-NATIVE<br />INTELLIGENCE
              </h2>
            </Reveal>
            <Reveal delay={0.2} className="max-w-sm">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                One unified interface. Chain-specific analyzers under the hood.
                Adding a new chain means implementing one interface — nothing else changes.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Chain selector — left panel */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            {CHAINS.map((chain, i) => {
              const statusCfg = STATUS_CONFIG[chain.status];
              const isActive = chain.id === activeChain;

              return (
                <motion.button
                  key={chain.id}
                  className="w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 flex items-center gap-4"
                  style={{
                    background: isActive ? chain.gradient : "transparent",
                    borderColor: isActive ? chain.color + "40" : "var(--border)",
                    cursor: chain.status === "soon" ? "not-allowed" : "pointer",
                    opacity: chain.status === "soon" ? 0.5 : 1,
                  }}
                  onClick={() => chain.status !== "soon" && setActiveChain(chain.id)}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: chain.status === "soon" ? 0.5 : 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: dur.medium, ease: ease.expo, delay: i * 0.06 }}
                  whileHover={chain.status !== "soon" ? { scale: 1.01 } : {}}
                >
                  {/* Chain symbol */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-black flex-shrink-0"
                    style={{
                      background: chain.color + "18",
                      color: chain.color,
                    }}
                  >
                    {chain.symbol}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
                      >
                        {chain.name}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {chain.family}
                    </div>
                  </div>

                  {isActive && (
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: chain.color }} />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Detail panel — right */}
          <motion.div
            key={active.id}
            className="lg:col-span-3 rounded-2xl border p-8 flex flex-col"
            style={{
              background: active.gradient,
              borderColor: active.color + "30",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.medium, ease: ease.expo }}
          >
            {/* Chain header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div
                  className="text-5xl font-black mb-1"
                  style={{ color: active.color, fontFamily: "var(--font-syne)" }}
                >
                  {active.name}
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {active.family}
                </div>
              </div>
              {active.contracts && (
                <div className="text-right">
                  <div
                    className="text-3xl font-black"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
                  >
                    {active.contracts}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    deployed contracts
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
              {active.description}
            </p>

            {/* Tools */}
            <div className="mt-auto">
              <div
                className="text-xs font-semibold tracking-wider uppercase mb-4"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
              >
                Analysis Tools
              </div>
              <div className="flex flex-wrap gap-2">
                {active.tools.map((tool) => (
                  <div
                    key={tool}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: active.color + "12",
                      color: "var(--text-secondary)",
                      border: `1px solid ${active.color}20`,
                    }}
                  >
                    <Check className="w-3 h-3" style={{ color: active.color }} />
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
