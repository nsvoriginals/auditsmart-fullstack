// app/dashboard/scan/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Download,
  Loader2,
  Zap,
  Brain,
  Sparkles
} from "lucide-react";

interface Finding {
  type: string;
  severity: string;
  description: string;
  recommendation?: string;
  line?: string | number;
  function?: string;
}

interface AuditResult {
  id: string;
  contract_name: string;
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

const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "critical": return { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
    case "high": return { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    case "medium": return { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    case "low": return { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    default: return { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" };
  }
};

const getSeverityBadge = (severity: string) => {
  const colors = {
    critical: "bg-red-500/20 text-red-400",
    high: "bg-orange-500/20 text-orange-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
    info: "bg-gray-500/20 text-gray-400",
  };
  return colors[severity?.toLowerCase() as keyof typeof colors] || colors.info;
};

export default function ScanPage() {
  const { data: session, update } = useSession();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [auditsLeft, setAuditsLeft] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  // Fetch user limits
  useEffect(() => {
    fetchUserLimits();
  }, []);

  const fetchUserLimits = async () => {
    try {
      const response = await fetch("/api/user/limits");
      const data = await response.json();
      if (response.ok) {
        setAuditsLeft(data.remaining);
        setUserPlan(data.plan?.toLowerCase() || "free");
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
    }
  };

  const runScan = async () => {
    if (!code.trim()) {
      setError("Please paste your Solidity contract code first.");
      return;
    }

    if (userPlan === "free" && auditsLeft !== null && auditsLeft <= 0) {
      setError("You've reached your audit limit. Upgrade your plan to continue.");
      return;
    }

    setError("");
    setResult(null);
    setScanning(true);

    try {
      const response = await fetch("/api/audit/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contract_code: code, 
          contract_name: name || "Smart Contract", 
          chain 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Scan failed.");
      }

      setResult(data);
      // Refresh user limits after successful scan
      await fetchUserLimits();
      await update(); // Update session to reflect new usage

    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const downloadPdf = async () => {
    if (!result?.id) return;
    try {
      const response = await fetch(`/api/audit/report/${result.id}/pdf`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit_${result.contract_name}_${result.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  const copyFindings = () => {
    if (!result?.findings) return;
    const text = JSON.stringify(result.findings, null, 2);
    navigator.clipboard.writeText(text);
  };

  const verdict = result?.deployment_verdict?.toUpperCase() || "";
  const riskInfo = result ? getRiskColor(result.risk_level) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--frost)" }}>
          Scan Contract
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Paste Solidity source code and run an AI-powered security audit.
        </p>
      </div>

      {/* Quota warning */}
      {userPlan === "free" && auditsLeft !== null && auditsLeft <= 1 && auditsLeft > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)" }}>
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-500">{auditsLeft} audit{auditsLeft !== 1 ? 's' : ''} remaining this month.</span>
          <Link href="/dashboard/pricing" className="text-yellow-500 underline text-sm ml-auto">Upgrade</Link>
        </div>
      )}

      {userPlan === "free" && auditsLeft === 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-lg" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
          <div>
            <p className="text-sm font-medium text-red-400">Audit limit reached</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Upgrade your plan to run more audits.</p>
          </div>
          <Link href="/dashboard/pricing" className="px-4 py-1.5 rounded-md bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white text-sm hover:opacity-90 transition-all">
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* Form Card */}
      <div className="card p-6 space-y-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Contract Name</label>
            <input 
              className="w-full px-3 py-2 rounded-md border" 
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              placeholder="MyToken" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Chain</label>
            <select 
              className="w-full px-3 py-2 rounded-md border cursor-pointer"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              value={chain} 
              onChange={e => setChain(e.target.value)}
            >
              {["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "base"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Solidity Source Code</label>
            <button 
              onClick={() => setCode(SAMPLE_CONTRACT)} 
              className="text-xs hover:underline transition-all"
              style={{ color: "var(--plum-light)" }}
            >
              Load sample
            </button>
          </div>
          <textarea
            className="w-full p-3 rounded-md border font-mono text-sm"
            style={{ 
              background: "var(--bg-input)", 
              borderColor: "var(--border)", 
              color: "var(--text-primary)",
              minHeight: 280,
              fontFamily: "monospace"
            }}
            placeholder="// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract { ... }"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {code.length.toLocaleString()} / 50,000 chars
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-md text-sm bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={runScan}
            disabled={scanning || (userPlan === "free" && auditsLeft === 0)}
            className="px-6 py-2.5 rounded-md bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {scanning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
            ) : (
              <><Shield className="w-4 h-4" /> Run Audit</>
            )}
          </button>
          {scanning && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Analyzing with {userPlan === "enterprise" ? "Claude Sonnet" : userPlan === "pro" ? "Claude Haiku" : "Groq + Gemini"}...
            </p>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Summary Card */}
          <div className="card p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
            <div className="flex flex-wrap items-start gap-6">
              {/* Risk Ring */}
              <div className="relative flex-shrink-0">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${riskInfo?.border}`}>
                  <span className="text-2xl font-bold" style={{ color: riskInfo?.text?.replace('text-', '') }}>
                    {result.risk_score}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="font-display text-2xl font-bold" style={{ color: "var(--frost)" }}>
                    {result.contract_name}
                  </h2>
                  {verdict && (
                    <span className="text-xs px-3 py-1 rounded-md font-mono" style={{ 
                      background: `rgba(${verdict === "SAFE" ? "74,222,128" : verdict === "CAUTION" ? "250,204,21" : "248,113,113"}, 0.1)`,
                      color: verdict === "SAFE" ? "#4ade80" : verdict === "CAUTION" ? "#facc15" : "#f87171",
                      border: `1px solid rgba(${verdict === "SAFE" ? "74,222,128" : verdict === "CAUTION" ? "250,204,21" : "248,113,113"}, 0.25)`
                    }}>
                      {verdict}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-primary)" }}>{result.summary}</p>
                <div className="flex flex-wrap gap-3 text-xs font-mono">
                  <span style={{ color: "#f87171" }}>{result.critical_count} Critical</span>
                  <span style={{ color: "#fb923c" }}>{result.high_count} High</span>
                  <span style={{ color: "#facc15" }}>{result.medium_count} Medium</span>
                  <span style={{ color: "#60a5fa" }}>{result.low_count} Low</span>
                  <span style={{ color: "var(--text-muted)" }}>{result.info_count} Info</span>
                  <span style={{ color: "var(--text-muted)" }}>· {(result.scan_duration_ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {result.pdf_available && (
                  <button onClick={downloadPdf} className="p-2 rounded-md hover:bg-[var(--bg-hover)] transition-colors" title="Download PDF">
                    <Download className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  </button>
                )}
                <button onClick={copyFindings} className="p-2 rounded-md hover:bg-[var(--bg-hover)] transition-colors" title="Copy findings">
                  <Copy className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>
            </div>
          </div>

          {/* Findings List */}
          {result.findings.length > 0 && (
            <div className="card overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold" style={{ color: "var(--frost)" }}>
                  Findings ({result.total_findings})
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {result.findings.map((finding, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => setExpandedFinding(expandedFinding === idx ? null : idx)}
                      className="w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity?.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{finding.type}</p>
                        {finding.function && (
                          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                            {finding.function}{finding.line ? ` · line ${finding.line}` : ""}
                          </p>
                        )}
                      </div>
                      {expandedFinding === idx ? (
                        <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      )}
                    </button>
                    
                    {expandedFinding === idx && (
                      <div className="px-6 pb-5 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                        <p className="text-sm pt-3" style={{ color: "var(--text-primary)" }}>{finding.description}</p>
                        {finding.recommendation && (
                          <div className="p-3 rounded-md" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Recommendation</p>
                            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{finding.recommendation}</p>
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

      {/* Test Mode Banner */}
      {process.env.NEXT_PUBLIC_RAZORPAY_TEST_MODE === "true" && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-yellow-500/95 backdrop-blur-sm rounded-lg shadow-xl p-4 border border-yellow-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-900 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 text-sm">🧪 TEST MODE</h4>
                <p className="text-xs text-yellow-800 mt-1">
                  No real payments are processed. Use test cards:
                </p>
                <div className="mt-2 space-y-1 text-xs font-mono text-yellow-800">
                  <p>4111 1111 1111 1111 — Visa (Success)</p>
                  <p>4242 4242 4242 4242 — Visa (Success)</p>
                  <p>5555 5555 5555 4444 — Mastercard (Success)</p>
                  <p>CVV: Any 3 digits • Expiry: Any future date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}