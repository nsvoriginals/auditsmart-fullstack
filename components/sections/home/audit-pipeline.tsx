"use client";
// components/sections/home/audit-pipeline.tsx — Live audit pipeline visualization

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ease, dur } from "@/components/motion/config";
import { Reveal, StaggerReveal } from "@/components/motion/primitives";
import {
  Upload, Code2, Shield, Search, Cpu, Braces,
  GitMerge, Fingerprint, FileCheck, ArrowRight,
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    id: "upload",
    icon: Upload,
    label: "Contract Upload",
    sublabel: "Solidity / Vyper",
    color: "#00d4ff",
    description: "Multi-file project support. Flattened or raw.",
  },
  {
    id: "compile",
    icon: Code2,
    label: "Compilation",
    sublabel: "solc-select",
    color: "#00d4ff",
    description: "Auto-detects pragma version, spins matching solc.",
  },
  {
    id: "slither",
    icon: Shield,
    label: "Slither",
    sublabel: "50+ detectors",
    color: "#00ff88",
    description: "SWC-mapped static analysis. Evidence, not guesses.",
  },
  {
    id: "semgrep",
    icon: Search,
    label: "Semgrep",
    sublabel: "Solidity rules",
    color: "#00ff88",
    description: "Pattern matching across custom + community rulesets.",
  },
  {
    id: "ast",
    icon: Braces,
    label: "AST Analysis",
    sublabel: "Structural",
    color: "#00ff88",
    description: "Control-flow and data-flow from the parse tree.",
  },
  {
    id: "ai",
    icon: Cpu,
    label: "AI Agents",
    sublabel: "8 Groq + 2 Gemini",
    color: "#a855f7",
    description: "Specialists in reentrancy, flash loans, proxies, and more.",
  },
  {
    id: "correlate",
    icon: GitMerge,
    label: "AI Correlation",
    sublabel: "Claude",
    color: "#a855f7",
    description: "Groups and de-duplicates findings, calibrates confidence.",
  },
  {
    id: "exploit",
    icon: Fingerprint,
    label: "Exploit Similarity",
    sublabel: "pgvector",
    color: "#f59e0b",
    description: "Cosine-distance match against Euler, DAO, Ronin, and 200+ exploits.",
  },
  {
    id: "report",
    icon: FileCheck,
    label: "Signed Report",
    sublabel: "Ed25519",
    color: "#00ff88",
    description: "Cryptographically signed. SARIF 2.1.0 + PDF + JSON.",
  },
];

// These are product specification values — not per-user metrics.
// Agent count and pipeline topology are deterministic from the codebase.
const PRODUCT_SPECS = [
  { value: "< 60s",  label: "Median Audit Time" },
  { value: "200+",   label: "Exploit KB Patterns" },
  { value: "10",     label: "Parallel AI Agents" },
  { value: "9",      label: "Pipeline Stages" },
];

export function AuditPipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState<string | null>(null);

  return (
    <section
      ref={ref}
      className="relative py-32 overflow-hidden"
      style={{ background: "var(--surface-1)" }}
    >
      {/* Section border top */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="mb-20">
          <Reveal>
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-4 block"
              style={{ color: "var(--brand)", fontFamily: "var(--font-dm-mono)" }}
            >
              Infrastructure
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              className="text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-tight mb-6"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
            >
              LIVE AUDIT<br />PIPELINE
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="max-w-xl text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Deterministic engines run first. Slither, Semgrep, and AST produce evidence.
              AI agents generate signal. Never the other way around.
            </p>
          </Reveal>
        </div>

        {/* Pipeline steps — horizontal scroll on mobile, full grid on desktop */}
        <div className="relative mb-16">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-[42px] left-[5%] right-[5%] h-px z-0"
            style={{ background: "var(--border)" }}>
            <motion.div
              className="h-full origin-left"
              style={{ background: "linear-gradient(to right, #00ff88, #00d4ff, #a855f7, #f59e0b, #00ff88)" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: inView ? 1 : 0 }}
              transition={{ duration: 2.4, ease: ease.expo, delay: 0.3 }}
            />
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4 lg:gap-2 relative z-10">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: dur.medium, ease: ease.expo, delay: 0.1 + i * 0.07 }}
                  onMouseEnter={() => setActiveStep(step.id)}
                  onMouseLeave={() => setActiveStep(null)}
                  className="flex flex-col items-center gap-3 cursor-default group"
                >
                  {/* Icon circle */}
                  <div
                    className="relative w-[72px] h-[72px] lg:w-[80px] lg:h-[80px] rounded-full flex items-center justify-center border transition-all duration-300"
                    style={{
                      background: isActive
                        ? `rgba(${hexToRgb(step.color)}, 0.1)`
                        : "var(--surface-2)",
                      borderColor: isActive ? step.color : "var(--border)",
                      boxShadow: isActive
                        ? `0 0 24px rgba(${hexToRgb(step.color)}, 0.3), 0 0 48px rgba(${hexToRgb(step.color)}, 0.1)`
                        : "none",
                    }}
                  >
                    <Icon
                      className="w-6 h-6 transition-colors duration-300"
                      style={{ color: isActive ? step.color : "var(--text-muted)" }}
                    />
                    {/* Step number */}
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{
                        background: "var(--surface-1)",
                        border: `1px solid ${step.color}`,
                        color: step.color,
                        fontFamily: "var(--font-dm-mono)",
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <div
                      className="text-xs font-semibold mb-0.5 transition-colors duration-300"
                      style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
                    >
                      {step.label}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
                    >
                      {step.sublabel}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Active step description panel */}
        <motion.div
          className="mb-20 h-16 flex items-center justify-center"
          animate={{ opacity: activeStep ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeStep && (() => {
            const step = PIPELINE_STEPS.find((s) => s.id === activeStep)!;
            return (
              <div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full border text-sm"
                style={{
                  background: `rgba(${hexToRgb(step.color)}, 0.06)`,
                  borderColor: `rgba(${hexToRgb(step.color)}, 0.3)`,
                  color: "var(--text-secondary)",
                }}
              >
                <span style={{ color: step.color }}>◆</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{step.label}:</span>
                {step.description}
              </div>
            );
          })()}
        </motion.div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: "var(--border)" }}
        >
          {PRODUCT_SPECS.map(({ value, label }, i) => (
            <Reveal
              key={label}
              delay={i * 0.08}
              className="flex flex-col items-center justify-center py-10 text-center"
              style={{ background: "var(--surface-1)" }}
            >
              <div
                className="text-4xl lg:text-5xl font-black mb-2"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-syne)",
                }}
              >
                {value}
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {label}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
