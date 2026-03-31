"use client";
// app/page.tsx — Landing page

import Link from "next/link";
import {Navbar} from "@/components/layout/Navbar"
import { Shield, Search, Zap, FileText, Brain, Eye } from "lucide-react";

const FEATURES = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Multi-Agent Analysis",
    desc: "Groq LLaMA, Claude, and Gemini independently audit your contract and cross-validate findings for maximum accuracy.",
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: "Smart Deduplication",
    desc: "Our engine merges duplicate findings from multiple agents, eliminating noise and surfacing what actually matters.",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Real-time Monitoring",
    desc: "Paste any contract address and watch live for vulnerability patterns, suspicious activity, and upgrade events.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "PDF Audit Reports",
    desc: "Download professional reports with executive summaries, severity rankings, and remediation code snippets.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Claude Opus Deep Audit",
    desc: "One-off deep scans with extended thinking — see the AI's full reasoning chain and get exploit-ready PoC scenarios.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Deployment Verdict",
    desc: "Every audit ends with a clear SAFE / CAUTION / DO NOT DEPLOY verdict backed by quantified risk scoring.",
  },
];

const STATS = [
  { value: "12,000+", label: "Contracts Audited" },
  { value: "98.4%", label: "Accuracy Rate" },
  { value: "<45s", label: "Avg Scan Time" },
  { value: "$0", label: "Start Free" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-mono tracking-wide bg-[rgba(97,45,83,0.1)] border border-[rgba(97,45,83,0.3)] text-[var(--plum-light)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--plum-light)] animate-pulse" />
            Powered by Claude Opus · Groq LLaMA · Gemini
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-[1.1] text-[var(--frost)]">
            Audit smart contracts
            <br />
            <span className="bg-gradient-to-r from-[var(--plum)] to-[var(--rose)] bg-clip-text text-transparent">
              before attackers do.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Multi-agent AI audits Solidity contracts in under 45 seconds. Find reentrancy, oracle manipulation,
            access control flaws, and 50+ vulnerability classes — with zero false positives.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[var(--plum)] text-white font-medium hover:bg-[var(--plum-light)] transition-all hover:translate-y-[-1px]"
            >
              Start auditing free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-hover)] transition-all"
            >
              See how it works
            </Link>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-3xl mx-auto text-left">
            <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--bg-card)]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-hover)]">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs font-mono text-[var(--text-muted)]">VulnerableVault.sol</span>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto bg-[var(--bg-card)] text-[var(--text-secondary)]">
                {`// ⚠ CRITICAL: Reentrancy vulnerability detected
function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);
    
    // ❌ External call BEFORE state update
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok);
    
    balances[msg.sender] -= amount; // too late
}

// ✅ AuditSmart fix suggestion:
// Move state update BEFORE external call (CEI pattern)`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-[var(--frost)] mb-2">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-mono uppercase tracking-wider text-[var(--plum-light)] mb-4">
              What we do
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--frost)] mb-4">
              Enterprise security.
              <br />
              <span className="bg-gradient-to-r from-[var(--plum)] to-[var(--rose)] bg-clip-text text-transparent">
                No retainer required.
              </span>
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--plum)] transition-all hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(97,45,83,0.1)] flex items-center justify-center mb-4 text-[var(--plum-light)] group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative rounded-2xl p-12 text-center overflow-hidden bg-gradient-to-br from-[rgba(97,45,83,0.1)] to-[var(--bg-card)] border border-[var(--plum)]/30">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--plum)] to-transparent" />
            
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--frost)] mb-4">
              3 free audits. No credit card.
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              Start securing your contracts today. Upgrade to Pro or Enterprise when you need more.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-[var(--plum)] text-white font-medium hover:bg-[var(--plum-light)] transition-all hover:translate-y-[-1px]"
            >
              Create free account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg text-[var(--text-secondary)]">
            Audit<span className="text-[var(--plum-light)]">Smart</span>
          </span>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} AuditSmart. Powered by Claude · Groq · Gemini.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Docs"].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}