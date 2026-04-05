"use client";
// app/page.tsx — Landing Page

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield, Search, Zap, FileText, Brain, Eye,
  ArrowRight, Lock, ScrollText, Infinity,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const FEATURES = [
  {
    icon: Brain,
    title: "Multi-Agent Core",
    description: "Groq LLaMA, Claude, and Gemini independently audit and cross-validate findings for maximum accuracy.",
  },
  {
    icon: Search,
    title: "Smart Deduplication",
    description: "Merge duplicate findings across agents, eliminating noise and surfacing what actually matters.",
  },
  {
    icon: Eye,
    title: "Real-time Monitoring",
    description: "Paste any contract address and watch live for vulnerabilities, suspicious patterns, and upgrades.",
  },
  {
    icon: FileText,
    title: "PDF Audit Reports",
    description: "Download professional reports with executive summaries, severity rankings, and remediation snippets.",
  },
  {
    icon: Zap,
    title: "Claude Deep Scan",
    description: "One-off deep audits with extended reasoning chains and exploit-ready proof-of-concept scenarios.",
  },
  {
    icon: Shield,
    title: "Deployment Verdict",
    description: "Every audit ends with a clear SAFE / CAUTION / DO NOT DEPLOY verdict and quantified risk score.",
  },
];

const STATS = [
  { value: "12,000+", label: "Contracts Audited" },
  { value: "98.4%",   label: "Accuracy Rate" },
  { value: "<45s",    label: "Avg Scan Time" },
  { value: "$0",      label: "Start Free" },
];

const STEPS = [
  { step: "01", icon: ScrollText, title: "Submit",  desc: "Paste your contract address or upload Solidity files directly." },
  { step: "02", icon: Brain,      title: "Analyze", desc: "Three AI agents audit in parallel, cross-referencing every finding." },
  { step: "03", icon: Shield,     title: "Act",     desc: "Get a clear verdict and actionable remediation steps instantly." },
];

const TRUSTED_BY = ["Aave", "Uniswap", "Curve", "Lido", "Chainlink"];

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--background)" }} />;
  }

  const dark = resolvedTheme === "dark";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--text-primary)" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .pulse { animation: pulse 2s infinite; }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <section
        className="bg-grid"
        style={{ position: "relative", padding: "96px 24px 120px", overflow: "hidden" }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            width: 700, height: 500,
            top: -200, left: "50%", transform: "translateX(-50%)",
            background: dark
              ? "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)"
              : "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 100,
              background: "var(--brand-faint)",
              border: "1px solid rgba(99,102,241,0.2)",
              marginBottom: 32,
              fontFamily: "'Satoshi', sans-serif",
              fontSize: 12, letterSpacing: "0.07em", textTransform: "uppercase",
              color: "var(--brand)",
              fontWeight: 500,
            }}
          >
            <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
            Multi-Agent · Claude · Groq · Gemini
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 24,
              color: "var(--text-primary)",
            }}
          >
            Audit smart contracts<br />
            <span style={{ color: "var(--brand)" }}>before attackers do.</span>
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: "var(--text-secondary)",
              maxWidth: 560,
              margin: "0 auto 40px",
              fontFamily: "'Satoshi', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Multi-agent AI audits Solidity contracts in under 45 seconds. Find reentrancy,
            oracle manipulation, access control flaws, and 50+ vulnerability classes.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 8,
                background: "var(--brand)", color: "#fff",
                fontWeight: 600, fontSize: 14,
                fontFamily: "'Satoshi', sans-serif",
                boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                transition: "background 0.15s, box-shadow 0.15s",
              }}
            >
              Start auditing free <ArrowRight size={14} />
            </Link>
            <Link
              href="#features"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 8,
                background: "var(--elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontWeight: 500, fontSize: 14,
                fontFamily: "'Satoshi', sans-serif",
                transition: "background 0.15s",
              }}
            >
              See how it works
            </Link>
          </div>

          {/* Code preview */}
          <div
            style={{
              marginTop: 64,
              borderRadius: 14,
              border: "1px solid var(--border)",
              overflow: "hidden",
              textAlign: "left",
              background: "var(--card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Title bar */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                background: "var(--elevated)",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              <span
                style={{
                  marginLeft: 8, fontSize: 11,
                  color: "var(--text-disabled)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                VulnerableVault.sol
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  padding: "2px 8px", borderRadius: 4, fontSize: 10,
                  fontWeight: 600, letterSpacing: "0.05em",
                  fontFamily: "'Satoshi', sans-serif",
                  background: "rgba(239,68,68,0.1)",
                  color: dark ? "#fca5a5" : "#dc2626",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                CRITICAL
              </span>
            </div>
            <pre
              style={{
                padding: "24px",
                fontSize: 13,
                lineHeight: 1.65,
                color: "var(--text-secondary)",
                overflowX: "auto",
                margin: 0,
                fontFamily: "'DM Mono', monospace",
              }}
            >
{`// ⚠  CRITICAL — Reentrancy vulnerability detected
function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);

    // ❌  External call BEFORE state update
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok);

    balances[msg.sender] -= amount; // too late
}

// ✅  Fix: move state update before external call (CEI pattern)`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <section style={{ padding: "52px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {STATS.map((s, i) => (
              <div
                key={s.label}
                style={{
                  textAlign: "center",
                  padding: "0 24px",
                  borderRight: i < 3 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 40, fontWeight: 800,
                    letterSpacing: "-0.02em", marginBottom: 6,
                    color: "var(--text-primary)",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em",
                    color: "var(--text-disabled)",
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ marginBottom: 60 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 100,
                background: "var(--brand-faint)",
                border: "1px solid rgba(99,102,241,0.15)",
                color: "var(--brand)",
                fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase",
                fontFamily: "'Satoshi', sans-serif", fontWeight: 500,
                marginBottom: 20,
              }}
            >
              <Lock size={10} /> Enterprise-grade
            </div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15,
                maxWidth: 620, color: "var(--text-primary)",
              }}
            >
              Security infrastructure.<br />
              <span style={{ color: "var(--brand)" }}>No retainer required.</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12, padding: 28,
                  boxShadow: "var(--shadow-card)",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "var(--brand-faint)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16, color: "var(--brand)",
                  }}
                >
                  <Icon size={17} />
                </div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 15, fontWeight: 700,
                    marginBottom: 8, color: "var(--text-primary)",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 13, lineHeight: 1.65,
                    color: "var(--text-muted)",
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                >
                  {description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted By ── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <section style={{ padding: "44px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--text-disabled)", marginBottom: 24,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Trusted by security teams at
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 52, flexWrap: "wrap" }}>
              {TRUSTED_BY.map((name) => (
                <span
                  key={name}
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 15, fontWeight: 700,
                    color: "var(--text-disabled)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── How it works ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 100,
                background: "var(--brand-faint)",
                border: "1px solid rgba(99,102,241,0.15)",
                color: "var(--brand)",
                fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase",
                fontFamily: "'Satoshi', sans-serif", fontWeight: 500,
                marginBottom: 20,
              }}
            >
              <Zap size={10} /> Three-step security
            </div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15,
                color: "var(--text-primary)",
              }}
            >
              From contract to verdict<br />
              <span style={{ color: "var(--brand)" }}>in under 45 seconds.</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            {STEPS.map(({ step, icon: Icon, title, desc }, i) => (
              <div
                key={step}
                style={{
                  padding: "40px 32px",
                  borderRight: i < 2 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 60, fontWeight: 800, lineHeight: 1,
                    letterSpacing: "-3px",
                    color: dark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)",
                    marginBottom: 4,
                  }}
                >
                  {step}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
                  <Icon size={15} style={{ color: "var(--brand)" }} />
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 16, fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {title}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13, lineHeight: 1.65,
                    color: "var(--text-muted)",
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "20px 24px 100px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 18, padding: "64px 48px",
              textAlign: "center",
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute", width: 400, height: 300,
                top: -120, left: "50%", transform: "translateX(-50%)",
                background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 100,
                  background: "var(--brand-faint)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  color: "var(--brand)",
                  fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase",
                  fontFamily: "'Satoshi', sans-serif", fontWeight: 500,
                  marginBottom: 24,
                }}
              >
                <Infinity size={10} /> No credit card
              </div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em",
                  marginBottom: 14, color: "var(--text-primary)",
                }}
              >
                3 free audits to start.
              </h2>
              <p
                style={{
                  fontSize: 14, lineHeight: 1.65,
                  color: "var(--text-muted)",
                  marginBottom: 36, maxWidth: 400,
                  marginLeft: "auto", marginRight: "auto",
                  fontFamily: "'Satoshi', sans-serif",
                }}
              >
                Experience multi-agent AI security. Upgrade to Pro or Enterprise when
                you need unlimited scans.
              </p>
              <Link
                href="/register"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "13px 32px", borderRadius: 8,
                  background: "var(--brand)", color: "#fff",
                  fontWeight: 600, fontSize: 14,
                  fontFamily: "'Satoshi', sans-serif",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
                }}
              >
                Create free account <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}