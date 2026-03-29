"use client";
// src/app/dashboard/scan/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Spinner, SeverityBadge, RiskRing, CopyButton, Toast } from "@/components/ui";

interface Finding {
  type: string;
  severity: string;
  description: string;
  recommendation?: string;
  line?: string | number;
  function?: string;
  confidence?: string;
}

interface AuditResult {
  id: string;
  risk_level: string;
  risk_score: number;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  findings: Finding[];
  summary: string;
  deployment_verdict: string;
  scan_duration_ms: number;
  pdf_available: boolean;
  plan_used: string;
}

const SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient");
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok);
        balances[msg.sender] -= amount;
    }
}`;

const VERDICT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "SAFE":           { color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.25)" },
  "CAUTION":        { color: "#facc15", bg: "rgba(250,204,21,0.08)",   border: "rgba(250,204,21,0.25)" },
  "DO NOT DEPLOY":  { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)" },
};

export default function ScanPage() {
  const { data: session } = useSession();
  const [code, setCode]         = useState("");
  const [name, setName]         = useState("");
  const [chain, setChain]       = useState("ethereum");
  const [scanning, setScanning] = useState(false);
  const [result, setResult]     = useState<AuditResult | null>(null);
  const [error, setError]       = useState("");
  const [toast, setToast]       = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const auditsLeft = session?.user?.free_audits_remaining ?? 0;

  const runScan = async () => {
    if (!code.trim()) { setError("Paste your Solidity contract code first."); return; }
    if (auditsLeft <= 0 && session?.user?.plan !== "enterprise") {
      setError("You've reached your audit limit. Upgrade your plan to continue.");
      return;
    }
    setError("");
    setResult(null);
    setScanning(true);

    try {
      const res = await fetch("/api/audit/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contract_code: code, contract_name: name || "Contract", chain }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? data.message ?? "Scan failed."); setScanning(false); return; }
      setResult(data);
      setToast({ msg: "Audit complete!", type: "success" });
    } catch {
      setError("Network error. Please try again.");
    }
    setScanning(false);
  };

  const downloadPdf = async () => {
    if (!result?.id) return;
    const res  = await fetch(`/api/audit/report/${result.id}/pdf`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `AuditSmart_${result.id.slice(0,8)}.pdf`; a.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "PDF downloaded", type: "success" });
  };

  const verdict = result?.deployment_verdict?.toUpperCase() ?? "";
  const verdictStyle = VERDICT_STYLE[verdict] ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-1" style={{ color: "var(--frost)" }}>Scan Contract</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Paste Solidity source code and run an AI-powered security audit.
        </p>
      </div>

      {/* Quota warning */}
      {auditsLeft <= 1 && auditsLeft > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
          style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)", color: "#facc15" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {auditsLeft} audit remaining. <Link href="/pricing" style={{ textDecoration: "underline" }}>Upgrade for more</Link>
        </div>
      )}
      {auditsLeft === 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-lg"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#f87171" }}>Audit limit reached</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Upgrade your plan to run more audits.</p>
          </div>
          <Link href="/pricing" className="btn btn-rose btn-sm" style={{ flexShrink: 0 }}>Upgrade Plan</Link>
        </div>
      )}

      {/* Form */}
      <div className="card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Contract Name</label>
            <input className="input" placeholder="MyToken" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Chain</label>
            <select className="input" value={chain} onChange={e => setChain(e.target.value)}
              style={{ appearance: "none", cursor: "pointer" }}>
              {["ethereum","polygon","arbitrum","optimism","bsc","avalanche","base"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Solidity Source Code</label>
            <button onClick={() => setCode(SAMPLE)} className="text-xs" style={{ color: "var(--plum-light)" }}>
              Load sample
            </button>
          </div>
          <textarea
            className="textarea input-mono"
            style={{ minHeight: 280, fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}
            placeholder={"// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract { ... }"}
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {code.length.toLocaleString()} / 50,000 chars
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-md text-sm"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={runScan}
            disabled={scanning || auditsLeft === 0}
            className="btn btn-primary btn-lg"
            style={{ minWidth: 160 }}
          >
            {scanning ? (
              <><Spinner size={16} /> Scanning…</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>Run Audit</>
            )}
          </button>
          {scanning && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Analyzing with {session?.user?.plan === "enterprise" ? "Claude Sonnet" : session?.user?.plan === "pro" ? "Claude Haiku" : "Groq + Gemini"}…
            </p>
          )}
        </div>
      </div>

      {/* ── RESULTS ───────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-5 animate-scale-in">
          {/* Summary row */}
          <div className="card p-6">
            <div className="flex flex-wrap items-start gap-6">
              <RiskRing score={result.risk_score} size={88} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="font-display text-2xl" style={{ color: "var(--frost)" }}>
                    {result.contract_name ?? name || "Contract"}
                  </h2>
                  {verdict && (
                    <span className="badge text-xs px-3 py-1"
                      style={{ background: verdictStyle.bg, color: verdictStyle.color, border: `1px solid ${verdictStyle.border}`, borderRadius: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                      {verdict}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-4 line-clamp-2 prose-audit">{result.summary}</p>
                <div className="flex flex-wrap gap-3 text-xs font-mono">
                  {[
                    { label: "Critical", val: result.critical_count, color: "#f87171" },
                    { label: "High",     val: result.high_count,     color: "#fb923c" },
                    { label: "Medium",   val: result.medium_count,   color: "#facc15" },
                    { label: "Low",      val: result.low_count,      color: "#60a5fa" },
                    { label: "Info",     val: result.info_count,     color: "var(--text-muted)" },
                  ].map(b => (
                    <span key={b.label} style={{ color: b.color }}>
                      {b.val} {b.label}
                    </span>
                  ))}
                  <span style={{ color: "var(--text-muted)" }}>
                    · {(result.scan_duration_ms / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {result.pdf_available && (
                  <button onClick={downloadPdf} className="btn btn-ghost btn-sm" title="Download PDF">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </button>
                )}
                <CopyButton text={JSON.stringify(result.findings, null, 2)} />
              </div>
            </div>
          </div>

          {/* Findings list */}
          {result.findings.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <h3 className="section-title mb-0">Findings ({result.total_findings})</h3>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {result.findings.map((f, i) => (
                  <div key={i} className="transition-colors" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full flex items-start gap-4 px-6 py-4 text-left"
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <SeverityBadge severity={f.severity} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.type}</p>
                        {f.function && <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>{f.function}{f.line ? ` · line ${f.line}` : ""}</p>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ flexShrink: 0, color: "var(--text-muted)", transform: expanded === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {expanded === i && (
                      <div className="px-6 pb-5 space-y-3 animate-fade-in" style={{ borderTop: "1px solid var(--border)" }}>
                        <p className="text-sm prose-audit pt-3">{f.description}</p>
                        {f.recommendation && (
                          <div className="p-3 rounded-md" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Recommendation</p>
                            <p className="text-sm prose-audit">{f.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}