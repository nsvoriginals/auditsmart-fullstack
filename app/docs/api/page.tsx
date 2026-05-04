"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Terminal, ChevronRight, Copy, Check, Key, Zap, Shield, FileText, Activity } from "lucide-react";

const BASE_URL = "https://api.auditsmart.org/v1";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/audit/scan",
    title: "Run an Audit",
    desc: "Submit a Solidity contract for analysis. Returns findings in JSON.",
    category: "Audits",
    badge: "Core",
    badgeColor: "var(--brand)",
  },
  {
    method: "GET",
    path: "/audit/results/:id",
    title: "Get Audit Results",
    desc: "Retrieve results for a completed audit by ID.",
    category: "Audits",
    badge: null,
    badgeColor: null,
  },
  {
    method: "GET",
    path: "/audit/history",
    title: "List Audit History",
    desc: "Get paginated list of all audits for the authenticated user.",
    category: "Audits",
    badge: null,
    badgeColor: null,
  },
  {
    method: "POST",
    path: "/audit/deep",
    title: "Run Deep Audit",
    desc: "Submit for Deep Audit with Claude Opus extended thinking. Returns PoCs and patched code.",
    category: "Deep Audit",
    badge: "Enterprise",
    badgeColor: "var(--brand-purple)",
  },
  {
    method: "GET",
    path: "/user/limits",
    title: "Get Usage Limits",
    desc: "Check remaining audits, rate limits, and plan details.",
    category: "User",
    badge: null,
    badgeColor: null,
  },
  {
    method: "GET",
    path: "/payment/plans",
    title: "List Plans",
    desc: "Get available subscription plans and their features.",
    category: "Billing",
    badge: null,
    badgeColor: null,
  },
];

const METHOD_COLORS: Record<string, { color: string; bg: string }> = {
  GET: { color: "var(--brand-green)", bg: "rgba(0,255,148,0.1)" },
  POST: { color: "var(--brand)", bg: "rgba(0,212,255,0.1)" },
  PUT: { color: "var(--warning)", bg: "rgba(245,158,11,0.1)" },
  DELETE: { color: "var(--destructive)", bg: "rgba(239,68,68,0.1)" },
};

const FULL_EXAMPLES = {
  scan: {
    title: "POST /audit/scan",
    request: `curl -X POST ${BASE_URL}/audit/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\ncontract Vulnerable {\\n  mapping(address => uint256) public balances;\\n\\n  function withdraw() external {\\n    uint256 amount = balances[msg.sender];\\n    (bool ok,) = msg.sender.call{value: amount}(\\"\\");\\n    balances[msg.sender] = 0; // ❌ state updated after call\\n  }\\n}",
    "options": {
      "deepScan": false,
      "includeFixCode": true
    }
  }'`,
    response: `{
  "auditId": "audit_7f8a3b2c",
  "status": "completed",
  "contractHash": "sha256:a1b2c3d4...",
  "duration": "48s",
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 1,
    "low": 2,
    "info": 3
  },
  "findings": [
    {
      "id": "REENTRANCY-001",
      "severity": "CRITICAL",
      "category": "Reentrancy",
      "title": "Reentrancy vulnerability in withdraw()",
      "description": "State update occurs after external call. Allows recursive withdrawal.",
      "line": 10,
      "agent": "ReentrancyAgent",
      "fix": {
        "code": "function withdraw() external {\\n  uint256 amount = balances[msg.sender];\\n  balances[msg.sender] = 0; // ✅ state first\\n  (bool ok,) = msg.sender.call{value: amount}(\\"\\");\\n}",
        "pattern": "Checks-Effects-Interactions"
      }
    }
  ],
  "reportUrl": "https://auditsmart.org/r/audit_7f8a3b2c",
  "pdfUrl": "https://auditsmart.org/r/audit_7f8a3b2c.pdf"
}`,
  },
  results: {
    title: "GET /audit/results/:id",
    request: `curl ${BASE_URL}/audit/results/audit_7f8a3b2c \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "auditId": "audit_7f8a3b2c",
  "status": "completed",
  "createdAt": "2025-05-01T12:00:00Z",
  "completedAt": "2025-05-01T12:00:48Z",
  "findings": [...],
  "reportUrl": "https://auditsmart.org/r/audit_7f8a3b2c"
}`,
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: "var(--elevated)",
        color: copied ? "var(--brand-green)" : "var(--text-muted)",
        border: "1px solid var(--border)",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-disabled)", fontFamily: "'DM Mono', monospace" }}>
          {lang}
        </span>
        <CopyButton text={code} />
      </div>
      <pre
        className="p-4 text-xs overflow-x-auto leading-relaxed"
        style={{ background: "var(--surface-1)", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", margin: 0 }}
      >
        {code}
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  const [activeExample, setActiveExample] = useState<"scan" | "results">("scan");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/docs" style={{ color: "var(--text-muted)" }} className="hover:underline">Docs</Link>
            <ChevronRight size={13} />
            <span style={{ color: "var(--text-primary)" }}>API Reference</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{
              background: "linear-gradient(135deg, var(--text-primary) 40%, var(--brand))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            API Reference
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "var(--text-muted)" }}>
            Integrate AuditSmart into your CI/CD pipeline, development workflow, or build your own security tooling on top of our API.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            {[
              { icon: Terminal, label: `Base URL: ${BASE_URL}` },
              { icon: Key, label: "Bearer Token Auth" },
              { icon: Activity, label: "JSON responses" },
              { icon: Zap, label: "Rate limited by plan" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <Icon size={12} style={{ color: "var(--brand)" }} />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid md:grid-cols-[220px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="hidden md:block">
          <nav className="sticky top-24 space-y-4">
            {["Authentication", "Audits", "Deep Audit", "User", "Billing", "Errors", "Rate Limits"].map((section) => (
              <div key={section}>
                <a
                  href={`#${section.toLowerCase().replace(/ /g, "-")}`}
                  className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--brand)"; (e.currentTarget as HTMLElement).style.background = "var(--brand-faint)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <ChevronRight size={10} />
                  {section}
                </a>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-14">
          {/* Authentication */}
          <section id="authentication" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Authentication</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              All API requests require an API key passed as a Bearer token in the Authorization header. Generate keys from Dashboard → Settings → API Keys.
            </p>
            <CodeBlock
              lang="Authorization Header"
              code={`Authorization: Bearer as_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
            />
            <div
              className="mt-4 rounded-xl p-4 text-xs"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", color: "var(--text-muted)" }}
            >
              <strong style={{ color: "var(--warning)" }}>Keep your API key secret.</strong> Never expose it in client-side code or public repositories. Rotate keys instantly from the dashboard if compromised.
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Rate Limits</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {[
                { plan: "Free", rate: "10 req/min", audits: "3/month", color: "var(--text-muted)" },
                { plan: "Pro", rate: "60 req/min", audits: "20/month", color: "var(--brand)" },
                { plan: "Enterprise", rate: "200 req/min", audits: "50/month", color: "var(--brand-purple)" },
              ].map((row, i) => (
                <div
                  key={row.plan}
                  className="grid grid-cols-3 px-5 py-3 text-sm"
                  style={{
                    background: i % 2 === 0 ? "var(--surface-1)" : "var(--background)",
                    borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="font-semibold" style={{ color: row.color }}>{row.plan}</span>
                  <span>{row.rate}</span>
                  <span>{row.audits}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              Rate limit headers included in all responses: <code style={{ color: "var(--brand)" }}>X-RateLimit-Remaining</code>, <code style={{ color: "var(--brand)" }}>X-RateLimit-Reset</code>
            </p>
          </section>

          {/* Endpoints */}
          <section id="audits" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Endpoints</h2>
            <div className="space-y-3 mb-10">
              {ENDPOINTS.map((ep) => {
                const mc = METHOD_COLORS[ep.method];
                return (
                  <div
                    key={ep.path}
                    className="flex flex-wrap items-start gap-3 p-4 rounded-xl"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                  >
                    <span
                      className="px-2.5 py-1 rounded text-[10px] font-bold uppercase"
                      style={{ background: mc.bg, color: mc.color, fontFamily: "'DM Mono', monospace" }}
                    >
                      {ep.method}
                    </span>
                    <code className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>{ep.path}</code>
                    {ep.badge && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${ep.badgeColor}18`, color: ep.badgeColor! }}
                      >
                        {ep.badge}
                      </span>
                    )}
                    <p className="w-full text-xs" style={{ color: "var(--text-muted)" }}>{ep.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Interactive example */}
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Live Examples</h3>
            <div className="flex gap-2 mb-5">
              {(Object.keys(FULL_EXAMPLES) as Array<keyof typeof FULL_EXAMPLES>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveExample(key)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: activeExample === key ? "linear-gradient(135deg, var(--brand-purple), var(--brand))" : "var(--elevated)",
                    color: activeExample === key ? "white" : "var(--text-muted)",
                    border: `1px solid ${activeExample === key ? "transparent" : "var(--border)"}`,
                  }}
                >
                  {FULL_EXAMPLES[key].title}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Request</p>
                <CodeBlock code={FULL_EXAMPLES[activeExample].request} lang="cURL" />
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Response</p>
                <CodeBlock code={FULL_EXAMPLES[activeExample].response} lang="JSON" />
              </div>
            </div>
          </section>

          {/* Errors */}
          <section id="errors" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Error Codes</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {[
                { code: "400", title: "Bad Request", desc: "Missing required fields or invalid Solidity syntax" },
                { code: "401", title: "Unauthorized", desc: "Missing or invalid API key" },
                { code: "403", title: "Forbidden", desc: "Audit limit exceeded for your plan" },
                { code: "404", title: "Not Found", desc: "Audit ID does not exist or belongs to another user" },
                { code: "429", title: "Too Many Requests", desc: "Rate limit exceeded. Check X-RateLimit-Reset header" },
                { code: "500", title: "Server Error", desc: "Unexpected error. Retry after a few seconds" },
              ].map((err, i) => (
                <div
                  key={err.code}
                  className="flex gap-4 px-5 py-3 text-sm items-start"
                  style={{
                    background: i % 2 === 0 ? "var(--surface-1)" : "var(--background)",
                    borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <code
                    className="text-xs font-bold w-10 text-center py-0.5 rounded flex-shrink-0"
                    style={{
                      background: err.code.startsWith("4") || err.code.startsWith("5") ? "rgba(239,68,68,0.1)" : "rgba(0,212,255,0.1)",
                      color: err.code.startsWith("4") || err.code.startsWith("5") ? "var(--destructive)" : "var(--brand)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {err.code}
                  </code>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{err.title}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{err.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SDK */}
          <section className="scroll-mt-24">
            <div
              className="rounded-2xl p-7"
              style={{
                background: "linear-gradient(135deg, rgba(123,47,255,0.07), rgba(0,212,255,0.05))",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,212,255,0.08)" }}
                >
                  <Shield size={18} style={{ color: "var(--brand)" }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>Need help with the API?</h3>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    Check out our community Discord for help, or open a support ticket if you&apos;re on a paid plan.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/community"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
                    >
                      <FileText size={12} /> Community Discord
                    </Link>
                    <Link
                      href="/support"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
                      style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)", background: "var(--elevated)" }}
                    >
                      Open Support Ticket
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
