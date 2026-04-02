"use client";
// app/dashboard/scan/page.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Loader2,
  FileCode,
  AlertCircle,
  Clock,
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

const getSeverityClass = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "low":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

const getVerdictClass = (verdict: string) => {
  switch (verdict?.toUpperCase()) {
    case "SAFE":
      return "bg-green-500/15 text-green-500 border-green-500/30";
    case "CAUTION":
      return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    default:
      return "bg-red-500/15 text-red-500 border-red-500/30";
  }
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
          chain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Scan failed.");
      }

      setResult(data);
      await fetchUserLimits();
      await update();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scan Contract</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste Solidity source code and run an AI-powered security audit.
        </p>
      </div>

      {/* Quota Warning */}
      {userPlan === "free" && auditsLeft !== null && auditsLeft <= 2 && auditsLeft > 0 && (
        <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-500">Limited audits remaining</h4>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {auditsLeft} audit{auditsLeft !== 1 ? 's' : ''} remaining this month.
                <Link href="/pricing" className="ml-2 underline font-medium">Upgrade</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {userPlan === "free" && auditsLeft === 0 && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-500">Audit limit reached</h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                Upgrade your plan to run more audits.
                <Link href="/pricing" className="ml-2 underline font-medium">Upgrade Plan</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scan Form Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Audit Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure your contract audit settings</p>
        
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Contract Name</label>
              <input
                type="text"
                placeholder="MyToken"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--plum-light)] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Blockchain Network</label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--plum-light)] transition-all"
              >
                {["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "base"].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-muted-foreground">Solidity Source Code</label>
              <button
                onClick={() => setCode(SAMPLE_CONTRACT)}
                className="text-sm text-[var(--plum-light)] hover:underline flex items-center gap-1"
              >
                <FileCode className="h-3 w-3" />
                Load Sample
              </button>
            </div>
            <textarea
              placeholder="// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract { ... }"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--plum-light)] transition-all resize-vertical"
            />
            <p className="text-xs text-muted-foreground">
              {code.length.toLocaleString()} / 50,000 characters
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={runScan}
            disabled={scanning || (userPlan === "free" && auditsLeft === 0)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Run Audit
              </>
            )}
          </button>

          {scanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analyzing contract</span>
                <span className="text-muted-foreground">AI Models</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] rounded-full transition-all" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Summary Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Risk Score Circle */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {result.risk_score}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-semibold text-foreground">{result.contract_name}</h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getVerdictClass(result.deployment_verdict)}`}>
                      {result.deployment_verdict}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {result.summary}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {result.pdf_available && (
                  <button
                    onClick={downloadPdf}
                    className="px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    PDF Report
                  </button>
                )}
                <button
                  onClick={copyFindings}
                  className="px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy Findings
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                {result.critical_count} Critical
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {result.high_count} High
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                {result.medium_count} Medium
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {result.low_count} Low
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                {result.info_count} Info
              </span>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {(result.scan_duration_ms / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Findings Section */}
          {result.findings.length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Findings</h3>
                <p className="text-sm text-muted-foreground">
                  {result.total_findings} security issues detected
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {result.findings.map((finding, idx) => {
                    const isExpanded = expandedFinding === idx;
                    const severityClass = getSeverityClass(finding.severity);
                    
                    return (
                      <div key={idx} className="rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => setExpandedFinding(isExpanded ? null : idx)}
                          className="w-full text-left hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 p-4">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${severityClass}`}>
                              {finding.severity?.toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {finding.type}
                              </p>
                              {finding.function && (
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                  {finding.function}
                                  {finding.line && ` · line ${finding.line}`}
                                </p>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border p-4 space-y-3 bg-muted/30">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Description
                              </p>
                              <p className="text-sm text-foreground">
                                {finding.description}
                              </p>
                            </div>
                            {finding.recommendation && (
                              <div className="rounded-lg bg-[var(--plum)]/5 p-3 border border-[var(--plum)]/10">
                                <p className="text-xs font-semibold text-[var(--plum-light)] uppercase tracking-wider mb-2">
                                  Recommendation
                                </p>
                                <p className="text-sm text-foreground">
                                  {finding.recommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}