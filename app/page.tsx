"use client";
// app/page.tsx — Landing Page — AuditSmart Dark Theme

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Link2,
  Sparkles,
  DoorOpen,
  FileText,
  Zap,
  Lock,
  RefreshCw,
  Hash,
  ShieldCheck,
  Puzzle,
  Gauge,
  Coins,
  PenTool,
  Star,
  Bug,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ─── Data ─── */
const STATS = [
  { value: "10", label: "AI Agents" },
  { value: "<60s", label: "Scan Time" },
  { value: "56%+", label: "Detection Rate" },
  { value: "$0", label: "To Start" },
];

const FEATURES = [
  {
    icon: Link2,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Multi-Agent Pipeline",
    desc: "8 Groq LLaMA 3.3 70B specialists + Gemini cross-validator + Slither. Each agent targets one vulnerability class in parallel.",
  },
  {
    icon: Sparkles,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Dedup Engine",
    desc: "Removes false positives, merges duplicates, auto-corrects severity. Clean actionable findings, not noise.",
  },
  {
    icon: DoorOpen,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Backdoor Detection",
    desc: "Dedicated agent hunts selfdestruct, delegatecall, and governance rug-pull vectors other scanners miss.",
  },
  {
    icon: FileText,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "PDF Audit Reports",
    desc: "Branded encrypted PDF with executive summary, severity breakdown, exploit paths, and fix code. Shareable public link.",
  },
  {
    icon: Zap,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Under 60 Seconds",
    desc: "Full multi-agent analysis in under a minute. Paste your Solidity code and get professional results instantly.",
  },
  {
    icon: Lock,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Zero Code Storage",
    desc: "Your contract is never stored. Only SHA256 hash retained for report verification. Privacy by design.",
  },
];

const AGENTS = [
  { icon: RefreshCw, label: "Reentrancy",   model: "Groq LLaMA" },
  { icon: Hash,       label: "Overflow",     model: "Groq LLaMA" },
  { icon: ShieldCheck,label: "Access Ctrl",  model: "Groq LLaMA" },
  { icon: Puzzle,     label: "Logic",        model: "Groq LLaMA" },
  { icon: Gauge,      label: "Gas / DoS",    model: "Groq LLaMA" },
  { icon: Coins,      label: "DeFi",         model: "Groq LLaMA" },
  { icon: DoorOpen,   label: "Backdoor",     model: "Groq LLaMA" },
  { icon: PenTool,    label: "Signature",    model: "Groq LLaMA" },
  { icon: Star,       label: "Gemini",       model: "Google AI"  },
  { icon: Bug,        label: "Slither",      model: "Crytic"     },
];

const STEPS = [
  { num: "01", title: "Paste Code",        desc: "Paste your Solidity contract in the editor. No setup, no installation required." },
  { num: "02", title: "10 Agents Scan",    desc: "Parallel AI + static analysis runs simultaneously across all vulnerability classes." },
  { num: "03", title: "Dedup & Validate",  desc: "Engine removes duplicates and false positives. Only real, unique findings remain." },
  { num: "04", title: "Download PDF",      desc: "Branded report with severity breakdown, fix code, and public share link." },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/ month",
    desc: "3 audits · forever",
    feats: ["3 audits / month", "8 Groq AI agents", "PDF reports", "Backdoor detection", "Public share link"],
    extras: [],
    featured: false,
    action: "Get Started Free",
    href: "/register",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    desc: "15 audits / month",
    feats: ["Everything in Free"],
    extras: ["Claude Haiku (Anthropic)", "Fix code in PDF", "Deployment verdict", "Priority support"],
    featured: true,
    badge: "POPULAR",
    action: "Upgrade to Pro",
    href: "/register",
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/ month",
    desc: "20 audits / month",
    feats: ["Everything in Pro"],
    extras: ["Claude Sonnet (stronger)", "Full exploit scenarios", "Patched code in PDF", "API access"],
    featured: false,
    action: "Upgrade Now",
    href: "/register",
  },
  {
    name: "Deep Audit",
    price: "$20",
    period: "/ audit",
    desc: "One-time · any plan",
    feats: ["Claude Opus (max power)"],
    extras: ["Extended Thinking visible", "Full exploit walkthrough", "SAFE / CAUTION / DANGER", "Patched production code"],
    featured: false,
    deep: true,
    action: "Activate Deep Audit",
    href: "/register",
  },
];

const POWERED = [
  { name: "Claude", sub: "by Anthropic" },
  { name: "Groq",   sub: "LLaMA 3.3 70B" },
  { name: "Gemini", sub: "by Google" },
  { name: "Slither",sub: "by Crytic" },
];

/* ─── Component ─── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--background)" }} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--text-primary)",
        fontFamily: "'Satoshi', sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        .hero-glow {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(120px);
        }
        .feat-card {
          background: var(--surface-1);
          transition: background var(--base), transform var(--base);
          cursor: default;
        }
        .feat-card:hover {
          background: var(--surface-2);
        }
        .agent-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px 16px;
          text-align: center;
          transition: background var(--base), border-color var(--base), transform var(--base);
          cursor: default;
        }
        .agent-card:hover {
          background: var(--surface-2);
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: var(--shadow-card-hover);
        }
        .step-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
          transition: background var(--base), border-color var(--base);
        }
        .step-card:hover {
          background: var(--surface-2);
          border-color: var(--border-strong);
        }
        .plan-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          transition: border-color var(--base);
        }
        .plan-card:hover {
          border-color: var(--border-strong);
        }
        .plan-card.featured {
          border-color: rgba(123,47,255,0.35);
          background: linear-gradient(180deg, rgba(123,47,255,0.05), var(--surface-1));
        }
        .plan-card.deep {
          border-color: rgba(255,61,154,0.25);
          background: linear-gradient(180deg, rgba(255,61,154,0.04), var(--surface-1));
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          border-radius: var(--radius);
          background: linear-gradient(135deg, var(--brand-purple), var(--brand));
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          font-family: 'Satoshi', sans-serif;
          border: none;
          cursor: pointer;
          transition: opacity var(--base), transform var(--base), box-shadow var(--base);
          text-decoration: none;
          letter-spacing: 0.01em;
        }
        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: var(--shadow-purple);
        }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          border-radius: var(--radius);
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          font-family: 'Satoshi', sans-serif;
          cursor: pointer;
          transition: border-color var(--base), color var(--base);
          text-decoration: none;
        }
        .btn-ghost:hover {
          border-color: var(--brand);
          color: var(--brand);
        }
        .ticker-track {
          display: flex;
          gap: 60px;
          animation: ticker 30s linear infinite;
          width: max-content;
        }
        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-green);
          box-shadow: 0 0 6px var(--brand-green);
          animation: blink 2s infinite;
        }
        .sec-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: var(--brand);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-family: 'Satoshi', sans-serif;
          margin-bottom: 14px;
        }
        @media (max-width: 768px) {
          .hero-stats { gap: 24px !important; }
          .grid-3     { grid-template-columns: 1fr !important; }
          .grid-5     { grid-template-columns: repeat(2,1fr) !important; }
          .grid-4     { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .grid-5     { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "100px 40px 80px",
          overflow: "hidden",
        }}
      >
        {/* Glow blobs */}
        <div
          className="hero-glow"
          style={{
            width: 700, height: 500,
            top: -200, left: "20%",
            background: "rgba(123,47,255,0.10)",
          }}
        />
        <div
          className="hero-glow"
          style={{
            width: 500, height: 400,
            top: 100, right: "10%",
            background: "rgba(0,212,255,0.06)",
          }}
        />
        {/* Grid bg */}
        <div
          className="bg-grid"
          style={{ position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none" }}
        />

        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div className="badge badge-green animate-slide-up" style={{ marginBottom: 32 }}>
            <span className="live-dot" />
            10 AI Agents · Live · Under 60 Seconds
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(42px, 6vw, 80px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              marginBottom: 24,
              color: "var(--text-primary)",
            }}
          >
            Find Vulnerabilities<br />
            Before{" "}
            <span className="text-gradient">Hackers Do.</span>
          </h1>

          <p
            style={{
              fontSize: 17,
              color: "var(--text-secondary)",
              maxWidth: 520,
              lineHeight: 1.75,
              marginBottom: 40,
              fontWeight: 400,
            }}
          >
            Multi-agent AI security for Solidity contracts — 10 specialist agents, dedup engine, professional PDF reports.{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>Results in under 60 seconds.</strong>
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 64 }}>
            <Link href="/register" className="btn-primary">
              Start Free Audit
              <ArrowRight size={15} />
            </Link>
            <a
              href="#how"
              className="btn-ghost"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How It Works
              <ChevronRight size={15} />
            </a>
          </div>

          {/* Stats */}
          <div
            className="hero-stats"
            style={{ display: "flex", gap: 48, flexWrap: "wrap", alignItems: "center" }}
          >
            {STATS.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 48 }}>
                <div>
                  <p
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      fontFamily: "'Satoshi', sans-serif",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      background: "linear-gradient(135deg, var(--text-primary), var(--brand))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-disabled)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
                {i < STATS.length - 1 && (
                  <div style={{ width: 1, height: 40, background: "var(--border)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        style={{
          background: "rgba(0,212,255,0.03)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
          padding: "10px 0",
        }}
      >
        <div className="ticker-track">
          {[
            { color: "#ef4444", text: "Critical reentrancy found in Token#4821" },
            { color: "#f59e0b", text: "Medium overflow risk in Contract#4820" },
            { color: "var(--brand-green)", text: "Contract#4819 passed · Score 94/100" },
            { color: "#ef4444", text: "Backdoor detected in Vault#4818" },
            { color: "var(--brand-green)", text: "DeFi#4817 clean · 0 critical issues" },
            { color: "#f59e0b", text: "Access control issue in Bridge#4816" },
            { color: "#ef4444", text: "Critical reentrancy found in Token#4821" },
            { color: "#f59e0b", text: "Medium overflow risk in Contract#4820" },
            { color: "var(--brand-green)", text: "Contract#4819 passed · Score 94/100" },
            { color: "#ef4444", text: "Backdoor detected in Vault#4818" },
            { color: "var(--brand-green)", text: "DeFi#4817 clean · 0 critical issues" },
            { color: "#f59e0b", text: "Access control issue in Bridge#4816" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontFamily: "monospace",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 6, height: 6,
                  borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 40px" }} id="features">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="sec-label">Capabilities</span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 16,
            }}
          >
            Every Angle Covered
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              maxWidth: 520,
              marginBottom: 56,
              lineHeight: 1.8,
            }}
          >
            Not another basic scanner. 10 parallel agents, dedup engine, and actionable results with fix code in seconds.
          </p>

          <div
            className="grid-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "1px",
              background: "var(--border)",
            }}
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="feat-card"
                  style={{ padding: 36 }}
                >
                  <div
                    style={{
                      width: 44, height: 44,
                      borderRadius: 10,
                      background: f.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 10,
                      color: "var(--text-primary)",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section style={{ padding: "0 40px 100px" }} id="agents">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="sec-label">AI Arsenal</span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 48,
            }}
          >
            10 Agents. Every Angle.
          </h2>
          <div
            className="grid-5"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: 12,
            }}
          >
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.label} className="agent-card">
                  <Icon
                    size={24}
                    style={{
                      color: "var(--brand)",
                      marginBottom: 10,
                      display: "block",
                      margin: "0 auto 10px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {a.label}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--text-disabled)",
                      fontFamily: "monospace",
                    }}
                  >
                    {a.model}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        style={{ padding: "100px 40px", background: "var(--surface-1)" }}
        id="how"
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="sec-label">Process</span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 48,
            }}
          >
            Audit in 4 Steps
          </h2>
          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 24,
              position: "relative",
            }}
          >
            {/* connector line */}
            <div
              style={{
                position: "absolute",
                top: 32,
                left: "10%",
                right: "10%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(0,212,255,0.25), var(--brand), rgba(0,212,255,0.25), transparent)",
              }}
            />
            {STEPS.map((s) => (
              <div key={s.num} className="step-card">
                <div
                  style={{
                    width: 56, height: 56,
                    borderRadius: "50%",
                    background: "rgba(0,212,255,0.06)",
                    border: "1px solid rgba(0,212,255,0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--brand)",
                    margin: "0 auto 20px",
                    fontFamily: "monospace",
                  }}
                >
                  {s.num}
                </div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: "var(--text-primary)",
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: "100px 40px" }} id="pricing">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="sec-label">Pricing</span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 16,
            }}
          >
            Simple. Transparent.
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              maxWidth: 520,
              marginBottom: 48,
              lineHeight: 1.8,
            }}
          >
            Professional audit reports at a fraction of manual audit costs. Start free, upgrade when ready.
          </p>

          <div
            className="grid-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
            }}
          >
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`plan-card${plan.featured ? " featured" : ""}${plan.deep ? " deep" : ""}`}
              >
                {plan.badge && (
                  <div className="badge badge-brand" style={{ marginBottom: 16, alignSelf: "flex-start" }}>
                    {plan.badge}
                  </div>
                )}
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: plan.deep ? "var(--brand-pink)" : "var(--text-secondary)",
                    marginBottom: 16,
                  }}
                >
                  {plan.name}
                </p>
                <p
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    fontFamily: "monospace",
                    lineHeight: 1,
                    marginBottom: 4,
                    color: plan.deep
                      ? "var(--brand-pink)"
                      : plan.featured
                      ? "var(--text-primary)"
                      : "var(--text-primary)",
                  }}
                >
                  {plan.price}{" "}
                  <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
                    {plan.period}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-disabled)",
                    marginBottom: 24,
                    fontFamily: "monospace",
                  }}
                >
                  {plan.desc}
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  {plan.feats.map((f) => (
                    <li
                      key={f}
                      style={{ fontSize: 14, color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 8 }}
                    >
                      <ArrowRight size={13} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </li>
                  ))}
                  {plan.extras.map((f) => (
                    <li
                      key={f}
                      style={{ fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 500 }}
                    >
                      <Sparkles size={13} style={{ color: plan.deep ? "var(--brand-pink)" : "var(--brand-purple)", flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Satoshi', sans-serif",
                    textDecoration: "none",
                    transition: "opacity var(--base), box-shadow var(--base), border-color var(--base), color var(--base)",
                    ...(plan.featured
                      ? {
                          background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
                          color: "#fff",
                          border: "none",
                        }
                      : plan.deep
                      ? {
                          background: "transparent",
                          border: `1px solid rgba(255,61,154,0.35)`,
                          color: "var(--brand-pink)",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text-secondary)",
                        }),
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.featured && !plan.deep) {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--brand)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand)";
                    } else if (plan.featured) {
                      (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-purple)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.featured && !plan.deep) {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-strong)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                    } else if (plan.featured) {
                      (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                    }
                  }}
                >
                  {plan.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POWERED BY ── */}
      <section
        style={{
          padding: "40px",
          background: "var(--surface-1)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-disabled)",
              marginBottom: 32,
              fontFamily: "monospace",
            }}
          >
            Powered by World-Class AI
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {POWERED.map((p, i) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    padding: "16px 24px",
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    transition: "border-color var(--base)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-disabled)", fontFamily: "monospace" }}>
                    {p.sub}
                  </p>
                </div>
                {i < POWERED.length - 1 && (
                  <div style={{ width: 1, height: 40, background: "var(--border)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}