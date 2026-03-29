"use client";
// src/app/page.tsx — Landing page

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

const FEATURES = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Multi-Agent Analysis",
    desc: "Groq LLaMA, Claude, and Gemini independently audit your contract and cross-validate findings for maximum accuracy.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    title: "Smart Deduplication",
    desc: "Our engine merges duplicate findings from multiple agents, eliminating noise and surfacing what actually matters.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: "Real-time Monitoring",
    desc: "Paste any contract address and watch live for vulnerability patterns, suspicious activity, and upgrade events.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    title: "PDF Audit Reports",
    desc: "Download professional reports with executive summaries, severity rankings, and remediation code snippets.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
    title: "Claude Opus Deep Audit",
    desc: "One-off deep scans with extended thinking — see the AI's full reasoning chain and get exploit-ready PoC scenarios.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    title: "Deployment Verdict",
    desc: "Every audit ends with a clear SAFE / CAUTION / DO NOT DEPLOY verdict backed by quantified risk scoring.",
  },
];

const STATS = [
  { value: "12,000+", label: "Contracts Audited" },
  { value: "98.4%",   label: "Accuracy Rate" },
  { value: "<45s",    label: "Avg Scan Time" },
  { value: "$0",      label: "Start Free" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="hero-gradient noise-overlay relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(97,45,83,0.15)", border: "1px solid rgba(97,45,83,0.35)", color: "var(--plum-light)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-plum" />
            Powered by Claude Opus · Groq LLaMA · Gemini
          </div>

          {/* Headline */}
          <h1 className="font-display mb-6" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1, color: "var(--frost)" }}>
            Audit smart contracts<br />
            <em className="not-italic gradient-text">before attackers do.</em>
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Multi-agent AI audits Solidity contracts in under 45 seconds. Find reentrancy, oracle manipulation,
            access control flaws, and 50+ vulnerability classes — with zero false positives.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn btn-primary btn-xl">
              Start auditing free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="#features" className="btn btn-ghost btn-xl">
              See how it works
            </Link>
          </div>

          {/* Code preview */}
          <div className="mt-16 max-w-2xl mx-auto text-left">
            <div className="card-elevated overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
                <span className="ml-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>VulnerableVault.sol</span>
              </div>
              <pre className="code-block rounded-none border-0 text-xs leading-relaxed" style={{ background: "var(--bg-surface)" }}>{`// ⚠  CRITICAL: Reentrancy vulnerability detected
function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);
    
    // ❌ External call BEFORE state update
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok);
    
    balances[msg.sender] -= amount; // too late
}

// ✅  AuditSmart fix suggestion:
// Move state update BEFORE external call (CEI pattern)`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section className="border-y" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl mb-1" style={{ color: "var(--frost)" }}>{s.value}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="section-sub">What we do</p>
          <h2 className="font-display text-4xl" style={{ color: "var(--frost)" }}>
            Enterprise security.<br />
            <span className="gradient-text-plum">No retainer required.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-6 flex flex-col gap-4">
              <div className="feature-icon">{f.icon}</div>
              <div>
                <h3 className="font-medium mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="card p-12 relative overflow-hidden glow-plum"
          style={{ borderColor: "var(--border-accent)", background: "linear-gradient(135deg, rgba(97,45,83,0.1) 0%, var(--bg-card) 70%)" }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--plum), transparent)" }} />
          <h2 className="font-display text-3xl mb-4" style={{ color: "var(--frost)" }}>
            3 free audits. No credit card.
          </h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
            Start securing your contracts today. Upgrade to Pro or Enterprise when you need more.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Create free account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t py-10" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg" style={{ color: "var(--text-secondary)" }}>
            Audit<span style={{ color: "var(--plum-light)" }}>Smart</span>
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} AuditSmart. Powered by Claude · Groq · Gemini.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Docs"].map((l) => (
              <Link key={l} href="#" className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}