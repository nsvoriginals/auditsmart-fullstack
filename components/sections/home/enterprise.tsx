"use client";
// components/sections/home/enterprise.tsx — Enterprise infrastructure section

import { motion } from "framer-motion";
import { ease, dur } from "@/components/motion/config";
import { Reveal } from "@/components/motion/primitives";
import {
  Container, Activity, KeyRound, Network,
  BarChart3, Database, Lock, Fingerprint,
} from "lucide-react";

const INFRA_CELLS = [
  {
    icon: Container,
    title: "Docker Isolation",
    desc: "Slither runs on an internal-only Docker network. No outbound internet. No supply-chain exposure.",
    color: "#00d4ff",
    span: "col-span-1",
  },
  {
    icon: Activity,
    title: "BullMQ Workers",
    desc: "Redis-backed job queue. Prioritized lanes: fast (< 60s), symbolic, AI enhancement. Dead-letter + retry.",
    color: "#a855f7",
    span: "col-span-1",
  },
  {
    icon: BarChart3,
    title: "Prometheus Metrics",
    desc: "Every queue, every job, every agent call — instrumented. Scrape-ready at :9090/metrics.",
    color: "#00ff88",
    span: "col-span-1",
  },
  {
    icon: Fingerprint,
    title: "Ed25519 Signed Reports",
    desc: "Every audit report is cryptographically signed. Content hash + signature verifiable offline.",
    color: "#f59e0b",
    span: "col-span-1",
  },
  {
    icon: Database,
    title: "pgvector Knowledge Base",
    desc: "300+ exploit embeddings stored in PostgreSQL. Cosine similarity search at query time, not batch.",
    color: "#00d4ff",
    span: "col-span-1 lg:col-span-2",
    wide: true,
  },
  {
    icon: Network,
    title: "Multi-Agent Pipeline",
    desc: "8 Groq specialists + 2 Gemini analysts + Claude enhancement — all parallel, Zod-validated, hallucination-firewalled.",
    color: "#a855f7",
    span: "col-span-1 lg:col-span-2",
    wide: true,
  },
  {
    icon: Lock,
    title: "Audit Reproducibility",
    desc: "Deterministic tool versions pinned. Any audit can be re-run identically. No AI-only results.",
    color: "#00ff88",
    span: "col-span-1",
  },
  {
    icon: KeyRound,
    title: "API Authentication",
    desc: "Scoped API keys per organization. Rate-limited per plan. Webhook HMAC verification.",
    color: "#f59e0b",
    span: "col-span-1",
  },
];

export function Enterprise() {
  return (
    <section className="relative py-32 overflow-hidden" style={{ background: "var(--surface-1)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />

      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 80%, rgba(123,47,255,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        {/* Header */}
        <div className="mb-20">
          <Reveal>
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-4 block"
              style={{ color: "#f59e0b", fontFamily: "var(--font-dm-mono)" }}
            >
              Enterprise
            </span>
          </Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <Reveal delay={0.1}>
              <h2
                className="text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
              >
                PRODUCTION-GRADE<br />INFRASTRUCTURE
              </h2>
            </Reveal>
            <Reveal delay={0.2} className="max-w-sm">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Built like a Trail of Bits tool. Deployed like a Vercel product.
                Every component observable, every result reproducible, every report verifiable.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Infrastructure grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INFRA_CELLS.map(({ icon: Icon, title, desc, color, span, wide }, i) => (
            <motion.div
              key={title}
              className={`${span} rounded-2xl border p-6 flex flex-col gap-4 group hover:border-opacity-60 transition-all duration-300`}
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: dur.medium, ease: ease.expo, delay: i * 0.06 }}
              whileHover={{ borderColor: color + "40", scale: 1.01 }}
            >
              {/* Icon */}
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    background: color + "18",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                {/* Glow dot */}
                <div
                  className="w-2 h-2 rounded-full mt-1"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <div
                  className={`font-semibold mb-2 transition-colors duration-300 ${wide ? "text-lg" : "text-sm"}`}
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
