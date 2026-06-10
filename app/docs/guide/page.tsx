"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  BookOpen, Shield, Atom, ArrowRight, ChevronRight, PlayCircle,
  FileText, Download, CheckCircle, AlertTriangle, Cpu, Layers, GitMerge, BarChart2,
} from "lucide-react";

type Tab = "standard" | "quantum";

// ── Severity reference (shared) ──────────────────────────────────────────────
const SEVERITIES = [
  { label: "Critical", color: "#ef4444", desc: "Funds at direct risk. Do not deploy — exploitable, high-impact (e.g. reentrancy on withdraw, missing access control on mint)." },
  { label: "High",     color: "#f97316", desc: "Serious flaw that can be exploited under realistic conditions. Fix before mainnet." },
  { label: "Medium",   color: "#ca8a04", desc: "Meaningful issue with limited impact or harder preconditions. Should be addressed." },
  { label: "Low",      color: "#3b82f6", desc: "Minor concern or hardening opportunity. Safe to deploy but worth fixing." },
  { label: "Info",     color: "#10b981", desc: "Best-practice notes, gas hints, and style suggestions. No security impact." },
];

// ── Standard audit steps ─────────────────────────────────────────────────────
const STANDARD_STEPS = [
  { title: "Open the scanner", desc: "From the dashboard, go to Scan Contract (or click New Audit). This is your entry point for every standard audit.", href: "/dashboard/scan", cta: "Open Scanner" },
  { title: "Paste your contract", desc: "Paste your full Solidity source — include all relevant contracts and imports, not just the vulnerable function. Pick the target chain and, if relevant, the token standard (ERC-20, ERC-721, ERC-4626…). The Solidity version is auto-detected from your pragma." },
  { title: "Run the audit", desc: "Hit Run Audit. Our pipeline fans out across 10 agents in parallel — 8 specialised Groq LLaMA agents (reentrancy, overflow, access control, logic, gas/DoS, DeFi, backdoor, signature), Google Gemini, and the Slither static analyzer — then de-duplicates overlapping findings." },
  { title: "Review the findings", desc: "Results arrive in under 60 seconds: an overall score, a severity breakdown, and each finding with a title, description, the exact line number, the offending snippet, and a concrete fix recommendation." },
  { title: "Export or share", desc: "Download a branded PDF report for your records or auditors, or share a public link to the result.", href: "/dashboard/history", cta: "View History" },
];

// ── Quantum audit steps ──────────────────────────────────────────────────────
const QUANTUM_STEPS = [
  { title: "Open Quantum Audit", desc: "From the dashboard sidebar, open Quantum Audit. It runs IBM Qiskit (AerSimulator) and AWS Braket (LocalSimulator) circuits in parallel — no cloud cost is incurred, everything runs on free simulators.", href: "/dashboard/quantum", cta: "Open Quantum Audit" },
  { title: "Provide bytecode + transaction data", desc: "Paste contract bytecode (0x…) or Solidity source into the first field. In Transaction Data, give key=value pairs describing a transaction, e.g. from=0xabc,to=0xdef,value=1000000000000000000. The VQC risk scorer maps these to circuit rotation angles." },
  { title: "(Optional) Tune the circuits", desc: "Under Advanced settings you can set n_qubits (2–10, IBM circuits only — Braket caps at 3) and shots (100–10,000 measurements per circuit). More shots = more statistically accurate scores, slightly slower." },
  { title: "Run & watch the circuits", desc: "Hit Run Quantum Audit. You'll see six live stages: connect → IBM Grover scan → IBM VQC scorer → Braket Grover scan → Braket VQC scorer → aggregate. Typical runtime is 30–120 seconds depending on qubit count." },
  { title: "Read the unified risk score", desc: "You get a single risk score from 0.00–1.00 with a severity label, plus a Circuit Breakdown showing each of the four circuits. The unified score is a weighted aggregate: 0.7 × worst-case circuit + 0.3 × average across circuits." },
];

const QUANTUM_CONCEPTS = [
  { icon: Cpu,       title: "Grover's Algorithm",    desc: "Quadratic-speedup search over contract bytecode for reentrancy and access-control patterns." },
  { icon: Layers,    title: "Variational QC (VQC)",  desc: "A two-layer RY/RZ circuit encodes transaction data and measures qubit-majority probability to score risk." },
  { icon: GitMerge,  title: "Dual-backend consensus", desc: "IBM Qiskit and AWS Braket circuits run simultaneously, so the verdict isn't tied to one engine." },
  { icon: BarChart2, title: "Unified risk score",     desc: "Weighted aggregation (70% worst-case + 30% average) across all four circuits into one 0–1 score." },
];

const QUANTUM_SCORE_BANDS = [
  { range: "0.80 – 1.00", color: "#ef4444", label: "Critical", desc: "Strong quantum signal of an exploitable pattern. Treat as a blocker and run a standard + manual review." },
  { range: "0.60 – 0.79", color: "#f97316", label: "High",     desc: "Elevated risk. Investigate the flagged vulnerability class before deploying." },
  { range: "0.40 – 0.59", color: "#ca8a04", label: "Medium",   desc: "Ambiguous signal — worth a closer look alongside a standard audit." },
  { range: "0.20 – 0.39", color: "#3b82f6", label: "Low",      desc: "Weak signal. Likely fine, but confirm with a standard audit." },
  { range: "0.00 – 0.19", color: "#10b981", label: "Minimal",  desc: "No meaningful quantum signal for the tested patterns." },
];

function StepList({ steps }: { steps: typeof STANDARD_STEPS }) {
  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4 rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--brand-faint)", color: "var(--brand)" }}>
            {i + 1}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
            {"href" in s && s.href && (
              <Link href={s.href} className="inline-flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "var(--brand)" }}>
                {s.cta} <ChevronRight size={11} />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GuidePage() {
  const [tab, setTab] = useState<Tab>("standard");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)", color: "var(--brand)" }}>
            <BookOpen size={11} /> User Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            How to run an audit
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Two ways to scan a contract on AuditSmart — a fast multi-agent <strong style={{ color: "var(--text-secondary)" }}>Standard Audit</strong>, and an experimental{" "}
            <strong style={{ color: "var(--text-secondary)" }}>Quantum Audit</strong> powered by IBM and AWS quantum circuits. This guide walks through both.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex gap-2 p-1 rounded-xl mb-10" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setTab("standard")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === "standard"
              ? { background: "var(--brand-faint)", color: "var(--brand)" }
              : { background: "transparent", color: "var(--text-muted)" }}
          >
            <Shield size={15} /> Standard Audit
          </button>
          <button
            onClick={() => setTab("quantum")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === "quantum"
              ? { background: "rgba(168,85,247,0.12)", color: "#a855f7" }
              : { background: "transparent", color: "var(--text-muted)" }}
          >
            <Atom size={15} /> Quantum Audit
          </button>
        </div>
      </div>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        {tab === "standard" ? (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}>What is a Standard Audit?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                A Standard Audit runs your contract through a 10-agent pipeline — 8 specialised Groq LLaMA agents, Google Gemini, and the Slither static
                analyzer — all in parallel, then merges and de-duplicates the findings. It completes in under 60 seconds and is the right starting point
                for almost every contract.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <PlayCircle size={18} style={{ color: "var(--brand)" }} /> Step by step
              </h2>
              <StepList steps={STANDARD_STEPS} />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>Reading the findings</h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
                Every finding is tagged with a severity. Triage from the top down — clear Critical and High issues before anything else.
              </p>
              <div className="space-y-2.5">
                {SEVERITIES.map((s) => (
                  <div key={s.label} className="flex gap-3 items-start rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0" style={{ background: `${s.color}1a`, color: s.color }}>{s.label}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <CheckCircle size={15} style={{ color: "var(--brand)" }} /> Tips for the best results
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} /> Paste the complete contract, including imported libraries and interfaces — context improves detection.</li>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} /> Make sure your code compiles (in Remix or Hardhat) before submitting to avoid compilation errors.</li>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} /> A zero-findings result is not a guarantee of safety — pair high-value contracts with a manual review.</li>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} /> Need exploit PoCs and production-ready patches? Use <Link href="/dashboard/deep-audit" style={{ color: "var(--brand)" }}>Deep Audit</Link> (Claude Opus).</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/scan" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}>
                <PlayCircle size={14} /> Run your first audit
              </Link>
              <Link href="/docs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)", background: "var(--elevated)" }}>
                <FileText size={14} /> Back to docs
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}>What is a Quantum Audit?</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                A Quantum Audit (Beta) analyses your contract using real quantum-computing algorithms running on simulators: Grover's search and variational
                quantum circuits, executed on both IBM Qiskit and AWS Braket. The four circuits run in parallel and are aggregated into one risk score.
                It complements — not replaces — the standard pipeline.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {QUANTUM_CONCEPTS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.title} className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                      <Icon size={16} style={{ color: "#a855f7", marginBottom: 8 }} />
                      <div className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{c.title}</div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{c.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <PlayCircle size={18} style={{ color: "#a855f7" }} /> Step by step
              </h2>
              <div className="space-y-4">
                {QUANTUM_STEPS.map((s, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7" }}>{i + 1}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                      {"href" in s && s.href && (
                        <Link href={s.href} className="inline-flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "#a855f7" }}>
                          {s.cta} <ChevronRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>Reading the risk score</h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
                The unified score runs from 0.00 (no signal) to 1.00 (strong signal). It's computed as{" "}
                <code style={{ fontFamily: "'DM Mono', monospace", color: "var(--text-secondary)" }}>0.7 × max_circuit_score + 0.3 × avg_circuit_score</code>,
                so a single alarming circuit still pulls the verdict up. Use it as a directional signal, then confirm with a Standard Audit.
              </p>
              <div className="space-y-2.5">
                {QUANTUM_SCORE_BANDS.map((b) => (
                  <div key={b.range} className="flex gap-3 items-center rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0 font-mono" style={{ background: `${b.color}1a`, color: b.color, fontFamily: "'DM Mono', monospace" }}>{b.range}</span>
                    <div className="flex-1">
                      <span className="text-sm font-bold" style={{ color: b.color }}>{b.label}</span>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.18)" }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <AlertTriangle size={15} style={{ color: "#a855f7" }} /> Standard vs Quantum — when to use which
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#a855f7" }} /> Use <strong style={{ color: "var(--text-secondary)" }}>Standard</strong> for every audit — it gives line-level findings and fix code across the full vulnerability taxonomy.</li>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#a855f7" }} /> Use <strong style={{ color: "var(--text-secondary)" }}>Quantum</strong> as a second-opinion signal on reentrancy / access-control patterns and transaction-risk scoring.</li>
                <li className="flex gap-2"><ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#a855f7" }} /> Quantum is in Beta and returns a probabilistic score, not line-by-line findings — always corroborate with a Standard Audit.</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/quantum" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                <Atom size={14} /> Try Quantum Audit
              </Link>
              <Link href="/docs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)", background: "var(--elevated)" }}>
                <FileText size={14} /> Back to docs
              </Link>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
