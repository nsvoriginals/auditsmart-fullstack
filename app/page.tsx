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
  Check,
  Lock,
  X,
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
import { useSession } from "next-auth/react";

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
    bg: "var(--brand-faint)",
    title: "Multi-Agent Pipeline",
    desc: "8 Groq LLaMA 3.3 70B specialists + Gemini cross-validator + Slither. Each agent targets one vulnerability class in parallel.",
  },
  {
    icon: Sparkles,
    color: "var(--brand)",
    bg: "var(--brand-faint)",
    title: "Dedup Engine",
    desc: "Removes false positives, merges duplicates, auto-corrects severity. Clean actionable findings, not noise.",
  },
  {
    icon: DoorOpen,
    color: "var(--brand)",
    bg: "var(--brand-faint)",
    title: "Backdoor Detection",
    desc: "Dedicated agent hunts selfdestruct, delegatecall, and governance rug-pull vectors other scanners miss.",
  },
  {
    icon: FileText,
    color: "var(--brand)",
    bg: "var(--brand-faint)",
    title: "PDF Audit Reports",
    desc: "Branded encrypted PDF with executive summary, severity breakdown, exploit paths, and fix code. Shareable public link.",
  },
  {
    icon: Zap,
    color: "var(--brand)",
    bg: "var(--brand-faint)",
    title: "Under 60 Seconds",
    desc: "Full multi-agent analysis in under a minute. Paste your Solidity code and get professional results instantly.",
  },
  {
    icon: Lock,
    color: "var(--brand)",
    bg: "var(--brand-faint)",
    title: "Zero Code Storage",
    desc: "Your contract is never stored. Only SHA256 hash retained for report verification. Privacy by design.",
  },
];

const AGENTS = [
  { icon: RefreshCw, label: "Reentrancy", model: "Groq LLaMA" },
  { icon: Hash, label: "Overflow", model: "Groq LLaMA" },
  { icon: ShieldCheck, label: "Access Ctrl", model: "Groq LLaMA" },
  { icon: Puzzle, label: "Logic", model: "Groq LLaMA" },
  { icon: Gauge, label: "Gas / DoS", model: "Groq LLaMA" },
  { icon: Coins, label: "DeFi", model: "Groq LLaMA" },
  { icon: DoorOpen, label: "Backdoor", model: "Groq LLaMA" },
  { icon: PenTool, label: "Signature", model: "Groq LLaMA" },
  { icon: Star, label: "Gemini", model: "Google AI" },
  { icon: Bug, label: "Slither", model: "Crytic" },
];

const STEPS = [
  { num: "01", title: "Paste Code", desc: "Paste your Solidity contract in the editor. No setup, no installation required." },
  { num: "02", title: "10 Agents Scan", desc: "Parallel AI + static analysis runs simultaneously across all vulnerability classes." },
  { num: "03", title: "Dedup & Validate", desc: "Engine removes duplicates and false positives. Only real, unique findings remain." },
  { num: "04", title: "Download PDF", desc: "Branded report with severity breakdown, fix code, and public share link." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    desc: "3 audits · forever",
    feats: ["3 audits / month", "8 Groq AI agents", "PDF reports", "Backdoor detection", "Public share link"],
    extras: [],
    featured: false,
    action: "Get Started Free",
    href: "/register",
    authHref: "/dashboard/scan",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "15 audits / month",
    feats: ["Everything in Free"],
    extras: ["Claude Haiku (Anthropic)", "Fix code in PDF", "Deployment verdict", "Priority support"],
    featured: true,
    badge: "POPULAR",
    action: "Upgrade to Pro",
    href: "/register",
    authHref: "/dashboard/billing",
  },
  {
    name: "Enterprise",
    price: "$29",
    period: "/ month",
    desc: "20 audits / month",
    feats: ["Everything in Pro"],
    extras: ["Claude Sonnet (stronger)", "Full exploit scenarios", "Patched code in PDF", "Quantum API"],
    featured: false,
    action: "Upgrade Now",
    href: "/register",
    authHref: "/dashboard/billing",
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
    authHref: "/dashboard/deep-audit",
  },
];

const POWERED = [
  { name: "Claude", sub: "by Anthropic" },
  { name: "Groq", sub: "LLaMA 3.3 70B" },
  { name: "Gemini", sub: "by Google" },
  { name: "Slither", sub: "by Crytic" },
];

/* ─── Component ─── */
export default function LandingPage() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user;

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
          border-color: rgba(99,102,241,0.40);
          background: var(--brand-faint);
        }
        .plan-card.deep {
          border-color: var(--border-strong);
          background: var(--surface-2);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 26px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--primary);
          color: var(--primary-foreground);
          font-weight: 600;
          font-size: 15px;
          font-family: 'Satoshi', sans-serif;
          border: none;
          cursor: pointer;
          transition: background var(--fast), transform var(--fast), box-shadow var(--fast);
          text-decoration: none;
        }
        .btn-primary:hover {
          background: var(--brand-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-brand);
        }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          height: 48px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 15px;
          font-family: 'Satoshi', sans-serif;
          cursor: pointer;
          transition: border-color var(--fast), background var(--fast);
          text-decoration: none;
        }
        .btn-ghost:hover {
          border-color: var(--text-muted);
          background: var(--surface-2);
        }
        /* Editorial section kicker */
        .sec-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .sec-kicker b { color: var(--brand); font-weight: 500; }
        .sec-kicker::before {
          content: "";
          width: 28px; height: 1px;
          background: var(--brand);
          display: inline-block;
        }
        /* Live scan preview panel */
        .scan-panel {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }
        .scan-head {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
        }
        .scan-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          opacity: 0;
          animation: slideUp 0.5s ease-out forwards;
        }
        .sev-chip {
          flex-shrink: 0;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
          text-transform: uppercase;
        }
        /* Bento feature grid */
        .bento {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: minmax(176px, auto);
          gap: 14px;
        }
        .bento-tile {
          position: relative;
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
          display: flex;
          flex-direction: column;
          transition: border-color var(--base), background var(--base), transform var(--base);
        }
        .bento-tile:hover {
          border-color: var(--border-strong);
          background: var(--surface-2);
          transform: translateY(-3px);
        }
        .bento-tile.big  { grid-column: span 2; grid-row: span 2; }
        .bento-tile.wide { grid-column: span 2; }
        /* Agent manifest roster */
        .manifest {
          border-top: 1px solid var(--border-strong);
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 56px;
        }
        .manifest-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 16px 8px;
          border-bottom: 1px solid var(--border);
          transition: background var(--fast), padding-left var(--fast);
        }
        .manifest-row:hover { background: var(--surface-1); padding-left: 16px; }
        .manifest-row:hover .m-idx { color: var(--brand); }
        .m-idx {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: var(--text-disabled);
          width: 24px; flex-shrink: 0;
          transition: color var(--fast);
        }
        /* Process big numerals */
        .proc-num {
          font-family: 'DM Mono', monospace;
          font-size: 60px; font-weight: 500; line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.2px var(--border-strong);
          margin-bottom: 20px;
          transition: -webkit-text-stroke-color var(--base);
        }
        .proc-step:hover .proc-num { -webkit-text-stroke-color: var(--brand); }
        @media (max-width: 860px) {
          .bento { grid-template-columns: 1fr 1fr; }
          .bento-tile.big  { grid-column: span 2; grid-row: span 1; }
          .bento-tile.wide { grid-column: span 2; }
          .manifest { grid-template-columns: 1fr; column-gap: 0; }
        }
        @media (max-width: 560px) {
          .bento { grid-template-columns: 1fr; }
          .bento-tile.big, .bento-tile.wide { grid-column: span 1; }
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
        @media (max-width: 960px) {
          .hero-grid  { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-panel { order: 2; }
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
          padding: "152px 40px 96px",
          overflow: "hidden",
        }}
      >
        {/* Single toned accent glow, upper-right */}
        <div
          className="hero-glow"
          style={{
            width: 620, height: 480,
            top: -160, right: "-4%",
            background: "rgba(99,102,241,0.10)",
          }}
        />
        {/* Subtle grid bg */}
        <div
          className="bg-grid"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%)",
          }}
        />

        <div
          className="hero-grid"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%",
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 72,
            alignItems: "center",
          }}
        >
          {/* ── Left: editorial copy ── */}
          <div className="animate-slide-up">
            <div className="sec-kicker">
              <span className="live-dot" />
              MULTI-AGENT SECURITY ENGINE
            </div>

            <h1
              style={{
                fontSize: "clamp(46px, 6.4vw, 92px)",
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
                marginBottom: 28,
                color: "var(--text-primary)",
              }}
            >
              Break your<br />
              contract{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>—</span><br />
              <span className="text-gradient">before they do.</span>
            </h1>

            <p
              style={{
                fontSize: 18,
                color: "var(--text-secondary)",
                maxWidth: 500,
                lineHeight: 1.65,
                marginBottom: 36,
                fontWeight: 450,
              }}
            >
              Ten specialist AI agents stress-test your Solidity in parallel, strip the
              false positives, and hand back a professional verdict —{" "}
              <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>in under 60 seconds.</strong>
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 }}>
              <Link href={isAuthed ? "/dashboard/scan" : "/register"} className="btn-primary">
                {isAuthed ? "Go to Dashboard" : "Start free audit"}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how"
                className="btn-ghost"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See how it works
              </a>
            </div>

            {/* Inline trust strip */}
            <div
              style={{
                display: "flex",
                gap: 22,
                flexWrap: "wrap",
                alignItems: "center",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12.5,
                color: "var(--text-muted)",
              }}
            >
              {STATS.map((s, i) => (
                <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 22 }}>
                  <span>
                    <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.value}</strong>{" "}
                    {s.label}
                  </span>
                  {i < STATS.length - 1 && (
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-disabled)" }} />
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: live scan panel ── */}
          <div className="hero-panel scan-panel animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {/* Window head */}
            <div className="scan-head">
              <span style={{ display: "flex", gap: 6 }}>
                <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#e5484d", opacity: 0.7 }} />
                <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#f5a524", opacity: 0.7 }} />
                <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#2ebd6b", opacity: 0.7 }} />
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "var(--text-secondary)", marginLeft: 6 }}>
                VaultV2.sol
              </span>
              <span
                className="badge badge-brand"
                style={{ marginLeft: "auto", fontSize: 10 }}
              >
                <span className="live-dot" /> SCAN COMPLETE
              </span>
            </div>

            {/* Findings */}
            {[
              { sev: "critical", title: "Reentrancy in withdraw()", meta: "line 84 · Reentrancy Agent" },
              { sev: "high", title: "Unchecked external call", meta: "line 112 · Logic Agent" },
              { sev: "medium", title: "Missing zero-address check", meta: "line 47 · Access Agent" },
            ].map((r, i) => (
              <div key={r.title} className={`scan-row sev-${r.sev}`} style={{ animationDelay: `${0.3 + i * 0.14}s`, background: "transparent", color: "inherit" }}>
                <span className={`sev-chip sev-${r.sev}`}>{r.sev}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {r.title}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: "var(--text-muted)" }}>
                    {r.meta}
                  </span>
                </span>
              </div>
            ))}

            {/* Verdict footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px", background: "var(--surface-2)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>72</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/100 risk</span>
              </div>
              <span className="sev-chip sev-critical" style={{ fontSize: 11, padding: "6px 12px" }}>
                Do not deploy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        style={{
          background: "var(--surface-1)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
          padding: "11px 0",
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

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 40px" }} id="features">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sec-kicker"><b>01</b>&nbsp;&nbsp;CAPABILITIES</div>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
              marginBottom: 16,
            }}
          >
            Every angle covered.
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

          <div className="bento">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const size = i === 0 ? "big" : [1, 4, 5].includes(i) ? "wide" : "";
              const isBig = size === "big";
              return (
                <div key={f.title} className={`bento-tile ${size}`}>
                  <div
                    style={{
                      width: isBig ? 52 : 44,
                      height: isBig ? 52 : 44,
                      borderRadius: 12,
                      background: "var(--brand-faint)",
                      border: "1px solid rgba(99,102,241,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: isBig ? 24 : 18,
                    }}
                  >
                    <Icon size={isBig ? 24 : 20} style={{ color: "var(--brand)" }} />
                  </div>
                  <h3
                    style={{
                      fontSize: isBig ? 24 : 17,
                      fontWeight: isBig ? 700 : 600,
                      letterSpacing: isBig ? "-0.02em" : "-0.01em",
                      marginBottom: isBig ? 14 : 9,
                      color: "var(--text-primary)",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: isBig ? 16 : 14.5,
                      color: "var(--text-secondary)",
                      lineHeight: 1.7,
                      maxWidth: isBig ? 420 : "none",
                    }}
                  >
                    {f.desc}
                  </p>

                  {/* Decorative agent strip in the big tile */}
                  {isBig && (
                    <div style={{ marginTop: "auto", paddingTop: 28, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {Array.from({ length: 8 }).map((_, k) => (
                          <span
                            key={k}
                            style={{
                              width: 7, height: 22, borderRadius: 3,
                              background: "var(--brand)",
                              opacity: 0.25 + k * 0.09,
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text-muted)" }}>
                        8 specialists · parallel
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section style={{ padding: "0 40px 100px" }} id="agents">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sec-kicker"><b>02</b>&nbsp;&nbsp;AI ARSENAL</div>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
              marginBottom: 48,
            }}
          >
            Ten agents. One pass.
          </h2>
          <div className="manifest">
            {AGENTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={a.label} className="manifest-row">
                  <span className="m-idx">{String(i + 1).padStart(2, "0")}</span>
                  <Icon size={16} style={{ color: "var(--brand)", flexShrink: 0, alignSelf: "center" }} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: "var(--text-primary)",
                    }}
                  >
                    {a.label}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {a.model}
                  </span>
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
          <div className="sec-kicker"><b>03</b>&nbsp;&nbsp;PROCESS</div>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
              marginBottom: 48,
            }}
          >
            Audit in four steps.
          </h2>
          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 32,
            }}
          >
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="proc-step"
                style={{ borderTop: "1px solid var(--border-strong)", paddingTop: 28 }}
              >
                <div className="proc-num">{s.num}</div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    marginBottom: 10,
                    color: "var(--text-primary)",
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      {/* ── PRICING ── */}
      <section style={{ padding: "100px 40px" }} id="pricing">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sec-kicker"><b>04</b>&nbsp;&nbsp;PRICING</div>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
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
                  href={isAuthed ? (plan as any).authHref : plan.href}
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

          {/* ✅ U-02: Pricing Comparison Table */}
          <div style={{ marginTop: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 100,
                background: "var(--brand-faint)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "var(--brand)",
                fontSize: "clamp(10px, 2.5vw, 11px)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "'Satoshi', sans-serif",
                marginBottom: 14
              }}>
                Compare Features
              </div>
              <h3 style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "clamp(20px, 4vw, 24px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "var(--text-primary)"
              }}>
                What's included in each plan
              </h3>
              <p style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: "var(--text-muted)",
                maxWidth: 520,
                margin: "12px auto 0",
                fontFamily: "'Satoshi', sans-serif"
              }}>
                Everything you need to secure your smart contracts
              </p>
            </div>

            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "var(--card)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                minWidth: 480,
                boxShadow: "var(--shadow-card)"
              }}>
                <thead>
                  <tr style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{
                      padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)",
                      textAlign: "left",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "clamp(12px, 3vw, 13px)",
                      fontWeight: 700,
                      color: "var(--text-primary)"
                    }}>
                      Feature
                    </th>
                    <th style={{
                      padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)",
                      textAlign: "center",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "clamp(12px, 3vw, 13px)",
                      fontWeight: 700,
                      color: "var(--text-primary)"
                    }}>
                      Free
                    </th>
                    <th style={{
                      padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)",
                      textAlign: "center",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "clamp(12px, 3vw, 13px)",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      background: "rgba(99,102,241,0.04)",
                      borderLeft: "1px solid var(--border)",
                      borderRight: "1px solid var(--border)"
                    }}>
                      Pro <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontWeight: 400 }}>$19</span>
                    </th>
                    <th style={{
                      padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)",
                      textAlign: "center",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "clamp(12px, 3vw, 13px)",
                      fontWeight: 700,
                      color: "var(--text-primary)"
                    }}>
                      Enterprise <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontWeight: 400 }}>$29</span>
                    </th>
                    <th style={{
                      padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)",
                      textAlign: "center",
                      fontFamily: "'Satoshi', sans-serif",
                      fontSize: "clamp(12px, 3vw, 13px)",
                      fontWeight: 700,
                      color: "var(--text-primary)"
                    }}>
                      Deep Audit <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontWeight: 400 }}>$20/audit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Audits", free: "10 lifetime", pro: "15/mo", enterprise: "20/mo", deep: "Unlimited" },
                    { feature: "AI Models", free: "Groq", pro: "Groq + Haiku", enterprise: "Groq + Sonnet", deep: "Opus + Thinking" },
                    { feature: "PDF Report", free: "Yes", pro: "Yes", enterprise: "Yes", deep: "Yes" },
                    { feature: "Fix Suggestions", free: "No", pro: "Yes", enterprise: "Yes", deep: "Yes" },
                    { feature: "Exploit Scenarios", free: "No", pro: "No", enterprise: "Yes", deep: "Yes" },
                    { feature: "Quantum API", free: "No", pro: "No", enterprise: "Yes", deep: "No" },
                    { feature: "Priority Support", free: "No", pro: "No", enterprise: "Yes", deep: "No" },
                  ].map((row, idx) => (
                    <tr
                      key={row.feature}
                      style={{
                        borderBottom: idx < 6 ? "1px solid var(--border)" : "none",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "var(--elevated)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <td style={{
                        padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)",
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "clamp(12px, 3vw, 13px)",
                        color: "var(--text-secondary)",
                        fontWeight: 500
                      }}>
                        {row.feature}
                      </td>
                      <td style={{
                        padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)",
                        textAlign: "center",
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "clamp(12px, 3vw, 13px)",
                        color: row.free === "Yes" ? "var(--success)" : "var(--text-primary)",
                        fontWeight: row.free === "Yes" ? 600 : 500
                      }}>
                        {row.free === "Yes" ? (
                          <Check size={16} style={{ margin: "0 auto", color: "var(--success)" }} />
                        ) : row.free === "No" ? (
                          <X size={14} style={{ margin: "0 auto", color: "var(--text-disabled)" }} />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{row.free}</span>
                        )}
                      </td>
                      <td style={{
                        padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)",
                        textAlign: "center",
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "clamp(12px, 3vw, 13px)",
                        color: row.pro === "Yes" ? "var(--success)" : "var(--text-primary)",
                        fontWeight: row.pro === "Yes" ? 600 : 500,
                        background: "rgba(99,102,241,0.02)",
                        borderLeft: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)"
                      }}>
                        {row.pro === "Yes" ? (
                          <Check size={16} style={{ margin: "0 auto", color: "var(--success)" }} />
                        ) : row.pro === "No" ? (
                          <X size={14} style={{ margin: "0 auto", color: "var(--text-disabled)" }} />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{row.pro}</span>
                        )}
                      </td>
                      <td style={{
                        padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)",
                        textAlign: "center",
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "clamp(12px, 3vw, 13px)",
                        color: row.enterprise === "Yes" ? "var(--success)" : "var(--text-primary)",
                        fontWeight: row.enterprise === "Yes" ? 600 : 500
                      }}>
                        {row.enterprise === "Yes" ? (
                          <Check size={16} style={{ margin: "0 auto", color: "var(--success)" }} />
                        ) : row.enterprise === "No" ? (
                          <X size={14} style={{ margin: "0 auto", color: "var(--text-disabled)" }} />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{row.enterprise}</span>
                        )}
                      </td>
                      <td style={{
                        padding: "clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)",
                        textAlign: "center",
                        fontFamily: "'Satoshi', sans-serif",
                        fontSize: "clamp(12px, 3vw, 13px)",
                        color: row.deep === "Yes" ? "var(--success)" : "var(--text-primary)",
                        fontWeight: row.deep === "Yes" ? 600 : 500
                      }}>
                        {row.deep === "Yes" ? (
                          <Check size={16} style={{ margin: "0 auto", color: "var(--success)" }} />
                        ) : row.deep === "No" ? (
                          <X size={14} style={{ margin: "0 auto", color: "var(--text-disabled)" }} />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{row.deep}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{
              textAlign: "center",
              fontSize: "clamp(10px, 2.5vw, 11px)",
              color: "var(--text-muted)",
              marginTop: 16,
              fontFamily: "'Satoshi', sans-serif"
            }}>
              *All plans include core security analysis. Deep Audit is an add-on available on any plan.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}