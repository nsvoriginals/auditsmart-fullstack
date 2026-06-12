"use client";
// components/sections/home/hero.tsx — Cinematic hero section

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Zap, Lock, Activity } from "lucide-react";
import { ease, dur, spring } from "@/components/motion/config";
import { MagneticButton } from "@/components/motion/primitives";

const WORD_VARIANTS = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: "0%",   opacity: 1 },
};

const TOOL_TICKER = [
  "Slither", "Semgrep", "AST Analysis", "Mythril",
  "pgvector", "Groq", "Gemini", "Claude", "Echidna",
  "SARIF 2.1", "ERC Compliance", "SWC Registry",
];

const STATUS_PILLS = [
  { icon: Activity, label: "10 AI Agents Active",  color: "#00ff88" },
  { icon: Shield,   label: "Deterministic-First",  color: "#00d4ff" },
  { icon: Zap,      label: "< 60s Analysis",       color: "#a855f7" },
  { icon: Lock,     label: "Ed25519 Signed Reports", color: "#f59e0b" },
];

const HEADLINE_WORDS_L1 = ["THE", "SECURITY"];
const HEADLINE_WORDS_L2 = ["LAYER", "FOR", "SMART", "CONTRACTS"];

interface HeroProps {
  isAuthed: boolean;
}

export function Hero({ isAuthed }: HeroProps) {
  const shouldReduce = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Atmospheric background ──────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10">
        {/* Dot grid */}
        <div className="absolute inset-0 hero-dot-grid opacity-40" />

        {/* Top-center radial glow — the "light source" */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.12) 0%, rgba(123,47,255,0.06) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Animated orb — violet */}
        <div
          className="absolute top-[20%] left-[15%] w-[480px] h-[480px] rounded-full hero-orb-violet"
          style={{ filter: "blur(80px)", opacity: 0.18 }}
        />

        {/* Animated orb — cyan */}
        <div
          className="absolute top-[30%] right-[12%] w-[360px] h-[360px] rounded-full hero-orb-cyan"
          style={{ filter: "blur(70px)", opacity: 0.14 }}
        />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 pt-32 pb-12 flex flex-col items-center text-center">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.medium, ease: ease.expo }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
          style={{
            borderColor: "rgba(0,212,255,0.25)",
            background: "rgba(0,212,255,0.06)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff88]" />
          </span>
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-mono)" }}>
            Research-Grade · Multi-Chain · AI-Native
          </span>
        </motion.div>

        {/* Headline — word-by-word reveal (from Lazarev pattern) */}
        <div aria-label="The security layer for smart contracts" className="mb-8">
          <div className="overflow-hidden">
            <motion.div
              className="flex flex-wrap justify-center gap-x-[0.3em] gap-y-1"
              variants={containerVariants}
              initial="hidden"
              animate={shouldReduce ? "visible" : "visible"}
            >
              {[...HEADLINE_WORDS_L1, ...HEADLINE_WORDS_L2].map((word, i) => (
                <div key={word + i} className="overflow-hidden">
                  <motion.span
                    className="block font-display text-[clamp(3rem,8.5vw,9rem)] font-black uppercase leading-[0.88] tracking-[-0.02em]"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
                    variants={WORD_VARIANTS}
                    transition={{ duration: dur.medium, ease: ease.expo, delay: i * 0.06 }}
                  >
                    {/* Visual accent on "SECURITY" */}
                    {word === "SECURITY" ? (
                      <span className="hero-security-word">{word}</span>
                    ) : word}
                  </motion.span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Sub-headline */}
        <motion.p
          className="max-w-2xl text-lg sm:text-xl leading-relaxed mb-10"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.medium, ease: ease.expo, delay: 0.6 }}
        >
          Deterministic analysis with Slither, Semgrep, and AST.{" "}
          <span style={{ color: "var(--text-primary)" }}>Multi-agent AI correlation.</span>{" "}
          Exploit similarity search via pgvector.
          Production-signed reports in under 60 seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.medium, ease: ease.expo, delay: 0.75 }}
        >
          <MagneticButton>
            <Link
              href={isAuthed ? "/dashboard" : "/register"}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm tracking-wide transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #00d4ff, #7b2fff)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(123,47,255,0.15)",
              }}
            >
              {isAuthed ? "Go to Dashboard" : "Start Free Audit"}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </MagneticButton>

          <MagneticButton>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm tracking-wide border transition-all duration-300 hover:bg-white/5"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                color: "var(--text-secondary)",
              }}
            >
              Read the Docs
            </Link>
          </MagneticButton>
        </motion.div>

        {/* Status pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.medium, delay: 0.9 }}
        >
          {STATUS_PILLS.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-secondary)",
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Tool ticker — infinite marquee (Sundown pattern, reimagined) */}
        <motion.div
          className="w-full relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.slow, delay: 1.1 }}
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
          <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />

          <div className="flex overflow-hidden select-none">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center gap-8 flex-shrink-0 ticker-scroll"
                aria-hidden={i > 0}
              >
                {TOOL_TICKER.map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center gap-3 whitespace-nowrap"
                  >
                    <span
                      className="text-xs font-medium tracking-widest uppercase"
                      style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
                    >
                      {tool}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--border-strong)" }}
                    >
                      ◆
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ─────────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: dur.slow, delay: 1.4 }}
      >
        <div
          className="w-px h-12 origin-top animate-scroll-line"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,212,255,0.4))" }}
        />
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}>
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
