"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  BookOpen, Zap, Shield, Code, ArrowRight, Terminal,
  PlayCircle, ChevronRight, Star, Package, Webhook
} from "lucide-react";

const QUICK_START = [
  {
    step: "01",
    title: "Create an Account",
    desc: "Register at auditsmart.org with your email or OAuth. Free tier includes 3 audits.",
    href: "/register",
    cta: "Sign Up Free",
  },
  {
    step: "02",
    title: "Paste Your Contract",
    desc: "Navigate to Dashboard → Scan Contract. Paste any Solidity file and hit Run Audit.",
    href: "/dashboard/scan",
    cta: "Open Scanner",
  },
  {
    step: "03",
    title: "Review Findings",
    desc: "Results arrive in under 60 seconds with severity ratings, descriptions, and fix code.",
    href: "/dashboard",
    cta: "View Dashboard",
  },
  {
    step: "04",
    title: "Download PDF Report",
    desc: "Export a branded PDF or share a public link to your audit results.",
    href: "/docs/api",
    cta: "API Reference",
  },
];

const SECTIONS = [
  {
    icon: PlayCircle,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Quick Start",
    desc: "Get your first audit running in under 5 minutes.",
    articles: ["Running your first audit", "Understanding scan results", "Downloading PDF reports", "Sharing audit links"],
    href: "#quickstart",
  },
  {
    icon: Shield,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Vulnerability Guide",
    desc: "Deep dives into every vulnerability class we detect.",
    articles: ["Reentrancy attacks", "Integer overflow/underflow", "Access control issues", "DeFi-specific vectors"],
    href: "#vulnerabilities",
  },
  {
    icon: Code,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "API Reference",
    desc: "REST API for programmatic access and CI/CD integration.",
    articles: ["Authentication", "POST /audit/scan", "GET /audit/results/:id", "Webhooks"],
    href: "/docs/api",
  },
  {
    icon: Zap,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Deep Audit",
    desc: "Claude Opus powered analysis with exploit PoCs and patched code.",
    articles: ["When to use Deep Audit", "Interpreting DeepScan results", "Exploit proof-of-concept guide", "Deployment verdicts"],
    href: "#deepaudit",
  },
  {
    icon: Package,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Integrations",
    desc: "GitHub Actions, Hardhat plugin, and CI/CD setup.",
    articles: ["GitHub Actions workflow", "Hardhat integration", "Foundry + AuditSmart", "Custom webhooks"],
    href: "#integrations",
  },
  {
    icon: Webhook,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Billing & Plans",
    desc: "Plan limits, upgrades, and API rate limits.",
    articles: ["Plan comparison", "API rate limits by plan", "Managing your subscription", "Enterprise options"],
    href: "#billing",
  },
];

const CODE_EXAMPLE = `// Quick audit via cURL
curl -X POST https://api.auditsmart.org/v1/audit/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "pragma solidity ^0.8.0; ...",
    "options": { "deepScan": false }
  }'

// Response
{
  "auditId": "audit_abc123",
  "status": "completed",
  "findings": [
    {
      "id": "REENTRANCY-001",
      "severity": "CRITICAL",
      "title": "Reentrancy vulnerability in withdraw()",
      "line": 42,
      "fix": "Add nonReentrant modifier"
    }
  ],
  "reportUrl": "https://auditsmart.org/r/abc123"
}`;

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)", color: "var(--brand)" }}
              >
                <BookOpen size={11} />
                Documentation
              </div>
              <h1
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5"
                style={{
                  background: "linear-gradient(135deg, var(--text-primary) 40%, var(--brand))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.03em",
                }}
              >
                AuditSmart Docs
              </h1>
              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
                Everything you need to scan smart contracts, interpret findings, integrate our API, and deploy safely.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#quickstart"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
                >
                  <PlayCircle size={14} /> Get Started
                </Link>
                <Link
                  href="/docs/api"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)", background: "var(--elevated)" }}
                >
                  <Terminal size={14} /> API Reference
                </Link>
              </div>
            </div>
            {/* Code preview */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
                <span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                <span className="ml-2 text-xs" style={{ color: "var(--text-disabled)", fontFamily: "'DM Mono', monospace" }}>audit-example.sh</span>
              </div>
              <pre
                className="p-5 text-xs overflow-x-auto leading-relaxed"
                style={{
                  background: "var(--surface-1)",
                  color: "var(--text-muted)",
                  fontFamily: "'DM Mono', monospace",
                  margin: 0,
                }}
              >
                {CODE_EXAMPLE}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Steps */}
      <section id="quickstart" className="py-16 px-4 sm:px-6 scroll-mt-20" style={{ background: "var(--surface-1)" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-extrabold tracking-tight mb-10 text-center"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Quick Start — 4 Steps
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {QUICK_START.map((step) => (
              <div
                key={step.step}
                className="rounded-xl p-5"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div
                  className="text-xs font-bold mb-3"
                  style={{ color: "var(--brand)", fontFamily: "'DM Mono', monospace" }}
                >
                  {step.step}
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "var(--brand)" }}
                >
                  {step.cta} <ChevronRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doc Sections */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-extrabold tracking-tight mb-10"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Browse Documentation
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="group rounded-2xl p-5 transition-all block"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: section.bg }}
                  >
                    <Icon size={18} style={{ color: section.color }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{section.title}</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>{section.desc}</p>
                  <ul className="space-y-1">
                    {section.articles.map((article) => (
                      <li key={article} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-disabled)" }}>
                        <ChevronRight size={9} />
                        {article}
                      </li>
                    ))}
                  </ul>
                  <div
                    className="flex items-center gap-1 mt-4 text-xs font-semibold group-hover:underline"
                    style={{ color: section.color }}
                  >
                    Browse <ArrowRight size={11} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Changelog / Popular */}
      <section className="py-16 px-4 sm:px-6" style={{ background: "var(--surface-1)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Star size={16} style={{ color: "var(--brand)" }} /> Popular Articles
            </h3>
            <ul className="space-y-3">
              {[
                "How to interpret CRITICAL findings",
                "Setting up GitHub Actions CI integration",
                "Understanding the Deep Audit verdict system",
                "API authentication and key management",
                "Slither integration explained",
                "False positive handling guide",
              ].map((article) => (
                <li key={article}>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm transition-all"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <ChevronRight size={12} />
                    {article}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>Changelog</h3>
            <div className="space-y-4">
              {[
                { version: "v2.4.0", date: "May 2025", note: "Claude Opus 4.7 integration for Deep Audit mode" },
                { version: "v2.3.0", date: "Apr 2025", note: "Webhook support for audit completion events" },
                { version: "v2.2.0", date: "Mar 2025", note: "Foundry integration and improved false-positive filtering" },
                { version: "v2.1.0", date: "Feb 2025", note: "GitHub Actions workflow template published" },
              ].map((item) => (
                <div key={item.version} className="flex gap-3">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded h-fit"
                    style={{ background: "var(--brand-faint)", color: "var(--brand)", fontFamily: "'DM Mono', monospace" }}
                  >
                    {item.version}
                  </span>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-disabled)" }}>{item.date}</div>
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
