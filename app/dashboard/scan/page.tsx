"use client";
// app/dashboard/scan/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield, AlertTriangle, ChevronDown, ChevronUp,
  Copy, Download, Loader2, FileCode, AlertCircle, Clock,
} from "lucide-react";

interface Finding {
  type: string; severity: string; description: string;
  recommendation?: string; line?: string | number; function?: string;
}

interface AuditResult {
  id: string; contract_name: string; risk_level: string; risk_score: number;
  total_findings: number; critical_count: number; high_count: number;
  medium_count: number; low_count: number; info_count: number;
  findings: Finding[]; summary: string; deployment_verdict: string;
  scan_duration_ms: number; pdf_available: boolean; plan_used: string;
}

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
}`;

/* ── severity / verdict helpers ── */
const SEV_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(239,68,68,0.1)",  text: "#ef4444", border: "rgba(239,68,68,0.25)" },
  high:     { bg: "rgba(249,115,22,0.1)", text: "#f97316", border: "rgba(249,115,22,0.25)" },
  medium:   { bg: "rgba(234,179,8,0.1)",  text: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  low:      { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  info:     { bg: "rgba(107,114,128,0.1)",text: "var(--text-muted)", border: "rgba(107,114,128,0.2)" },
};
const sevStyle = (s: string) => SEV_STYLES[s?.toLowerCase()] ?? SEV_STYLES.info;

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  SAFE:    { bg: "rgba(16,185,129,0.1)", text: "#10b981", border: "rgba(16,185,129,0.25)" },
  CAUTION: { bg: "rgba(234,179,8,0.1)",  text: "#ca8a04", border: "rgba(234,179,8,0.25)" },
};
const verdictStyle = (v: string) =>
  VERDICT_STYLES[v?.toUpperCase()] ?? { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.25)" };

/* ── inline style helpers for inputs ── */
const inputBase: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "'Satoshi', sans-serif",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s",
};

export default function ScanPage() {
  const { data: session, update } = useSession();
  const [code, setCode]           = useState("");
  const [name, setName]           = useState("");
  const [chain, setChain]         = useState("ethereum");
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState<AuditResult | null>(null);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [auditsLeft, setAuditsLeft] = useState<number | null>(null);
  const [userPlan, setUserPlan]   = useState<string>("free");

  useEffect(() => { fetchLimits(); }, []);

  const fetchLimits = async () => {
    try {
      const res  = await fetch("/api/user/limits");
      const data = await res.json();
      if (res.ok) { setAuditsLeft(data.remaining); setUserPlan(data.plan?.toLowerCase() ?? "free"); }
    } catch { /* silent */ }
  };

  const runScan = async () => {
    if (!code.trim()) { setError("Please paste your Solidity contract code first."); return; }
    if (userPlan === "free" && auditsLeft !== null && auditsLeft <= 0) {
      setError("You've reached your audit limit. Upgrade your plan to continue."); return;
    }
    setError(""); setResult(null); setScanning(true);
    try {
      const res  = await fetch("/api/audit/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_code: code, contract_name: name || "Smart Contract", chain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Scan failed.");
      setResult(data);
      await fetchLimits();
      await update();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally { setScanning(false); }
  };

  const downloadPdf = async () => {
    if (!result?.id) return;
    const res  = await fetch(`/api/audit/report/${result.id}/pdf`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `Audit_${result.contract_name}_${result.id.slice(0, 8)}.pdf`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copyFindings = () => {
    if (!result?.findings) return;
    navigator.clipboard.writeText(JSON.stringify(result.findings, null, 2));
  };

  const limitReached = userPlan === "free" && auditsLeft === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 4 }}>
          Scan Contract
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
          Paste Solidity source code and run an AI-powered security audit.
        </p>
      </div>

      {/* Quota warning */}
      {userPlan === "free" && auditsLeft !== null && auditsLeft <= 2 && auditsLeft > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertTriangle className="h-4 w-4 mt-0.5" style={{ color: "#ca8a04", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#ca8a04", fontFamily: "'Satoshi', sans-serif" }}>Limited audits remaining</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
              {auditsLeft} audit{auditsLeft !== 1 ? "s" : ""} remaining this month.{" "}
              <Link href="/pricing" style={{ color: "var(--brand)", textDecoration: "underline" }}>Upgrade</Link>
            </p>
          </div>
        </div>
      )}

      {limitReached && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: "#ef4444", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>Audit limit reached</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
              <Link href="/pricing" style={{ color: "var(--brand)", textDecoration: "underline" }}>Upgrade your plan</Link> to run more audits.
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 28, boxShadow: "var(--shadow-card)" }}>
        <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 4 }}>Audit Configuration</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, fontFamily: "'Satoshi', sans-serif" }}>Configure your contract audit settings</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contract Name</label>
            <input style={inputBase} type="text" placeholder="MyToken" value={name} onChange={e => setName(e.target.value)}
              onFocus={e => (e.target.style.borderColor = "var(--brand)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Blockchain Network</label>
            <select style={{ ...inputBase, cursor: "pointer" }} value={chain} onChange={e => setChain(e.target.value)}>
              {["ethereum","polygon","arbitrum","optimism","bsc","avalanche","base"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Solidity Source Code</label>
            <button onClick={() => setCode(SAMPLE_CONTRACT)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--brand)", fontSize: 12, cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}>
              <FileCode className="h-3 w-3" /> Load Sample
            </button>
          </div>
          <textarea
            rows={12}
            placeholder={"// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract { ... }"}
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{ ...inputBase, fontFamily: "'Satoshi', monospace", resize: "vertical", minHeight: 240 }}
            onFocus={e => (e.target.style.borderColor = "var(--brand)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")}
          />
          <p style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 4, fontFamily: "'Satoshi', sans-serif" }}>
            {code.length.toLocaleString()} / 50,000 characters
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertCircle className="h-4 w-4" style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>{error}</span>
          </div>
        )}

        <button
          onClick={runScan}
          disabled={scanning || limitReached}
          style={{
            width: "100%", padding: "12px 0",
            background: scanning || limitReached ? "var(--elevated)" : "var(--brand)",
            color: scanning || limitReached ? "var(--text-disabled)" : "#fff",
            border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif",
            fontSize: 14, fontWeight: 600, cursor: scanning || limitReached ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.15s",
          }}
        >
          {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</> : <><Shield className="h-4 w-4" /> Run Audit</>}
        </button>

        {scanning && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif" }}>
              <span>Analyzing contract…</span><span>AI Models</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--elevated)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "65%", background: "var(--brand)", borderRadius: 2 }} />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">

          {/* Summary */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 24, boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {/* Score ring */}
                <div style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{result.risk_score}</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>{result.contract_name}</h3>
                    <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "'Satoshi', sans-serif", ...verdictStyle(result.deployment_verdict), border: `1px solid ${verdictStyle(result.deployment_verdict).border}` }}>
                      {result.deployment_verdict}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", maxWidth: 420 }}>{result.summary}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {result.pdf_available && (
                  <button onClick={downloadPdf} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "'Satoshi', sans-serif", transition: "color 0.15s" }}>
                    <Download className="h-3 w-3" /> PDF
                  </button>
                )}
                <button onClick={copyFindings} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}>
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            </div>

            {/* Counts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Critical", count: result.critical_count, ...SEV_STYLES.critical },
                { label: "High",     count: result.high_count,     ...SEV_STYLES.high },
                { label: "Medium",   count: result.medium_count,   ...SEV_STYLES.medium },
                { label: "Low",      count: result.low_count,      ...SEV_STYLES.low },
                { label: "Info",     count: result.info_count,     ...SEV_STYLES.info },
              ].map(({ label, count, bg, text, border }) => (
                <span key={label} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, fontFamily: "'Satoshi', sans-serif", background: bg, color: text, border: `1px solid ${border}` }}>
                  {count} {label}
                </span>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", marginLeft: 4 }}>
                <Clock className="h-3 w-3" />
                {(result.scan_duration_ms / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Findings */}
          {result.findings.length > 0 && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 2 }}>Findings</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>{result.total_findings} security issues detected</p>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                {result.findings.map((finding, idx) => {
                  const isOpen = expanded === idx;
                  const ss = sevStyle(finding.severity);
                  return (
                    <div key={idx} style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : idx)}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}
                      >
                        <span style={{ padding: "2px 9px", borderRadius: 5, fontSize: 10, fontWeight: 600, fontFamily: "'Satoshi', sans-serif", letterSpacing: "0.05em", background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`, flexShrink: 0 }}>
                          {finding.severity?.toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: "'Satoshi', sans-serif", marginBottom: 2 }}>{finding.type}</p>
                          {finding.function && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Satoshi', monospace" }}>
                              {finding.function}{finding.line && ` · line ${finding.line}`}
                            </p>
                          )}
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                      </button>

                      {isOpen && (
                        <div style={{ borderTop: "1px solid var(--border)", padding: 16, background: "var(--elevated)", display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'Satoshi', sans-serif" }}>Description</p>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif", lineHeight: 1.65 }}>{finding.description}</p>
                          </div>
                          {finding.recommendation && (
                            <div style={{ padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.15)" }}>
                              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'Satoshi', sans-serif" }}>Recommendation</p>
                              <p style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif", lineHeight: 1.65 }}>{finding.recommendation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}