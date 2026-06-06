"use client";
// app/dashboard/scan/page.tsx (FIXED - Handles Async 202 Responses)

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield, AlertTriangle, ChevronDown, ChevronUp,
  Copy, Download, Loader2, FileCode, AlertCircle, Clock,
  CheckCircle2, Circle,
} from "lucide-react";
import { CHAINS, getChain } from "@/lib/chains";
import { standardsForChain } from "@/lib/standards";

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

interface AsyncResponse {
  success: boolean;
  job_id: string;
  report_id: string;
  status: string;
  message: string;
  estimated_time_seconds: number;
  status_url: string;
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

// Per-chain placeholder samples shown in the code textarea when the user
// switches chains. Each is a tiny, recognizable starter contract / payload
// so the user knows the platform actually expects that language as input.
const SAMPLE_BY_CHAIN: Record<string, string> = {
  ethereum: SAMPLE_CONTRACT,
  bsc: SAMPLE_CONTRACT,
  polygon: SAMPLE_CONTRACT,
  avalanche: SAMPLE_CONTRACT,
  arbitrum: SAMPLE_CONTRACT,
  optimism: SAMPLE_CONTRACT,
  base: SAMPLE_CONTRACT,
  tron: SAMPLE_CONTRACT,
  ton: `;; TON FunC Jetton master (TEP-74) — minimal example
() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (in_msg_body.slice_empty?()) { return (); }
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    if (op == 0x178d4519) { ;; op::internal_transfer
        ;; ... handle transfer
    }
}`,
  solana: `// Solana / Anchor program — minimal SPL token mint
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

declare_id!("Fg6PaFpoGXkYsidMpWxqSWBDgKpKxKMUcDqXQAEXKxLb");

#[program]
pub mod my_token {
    use super::*;
    pub fn mint_to(ctx: Context<MintToCtx>, amount: u64) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to:   ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        token::mint_to(CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts), amount)?;
        Ok(())
    }
}`,
  bitcoin: `{
  "p": "brc-20",
  "op": "deploy",
  "tick": "AUDT",
  "max": "21000000",
  "lim": "1000"
}`,
  cosmos: `// CosmWasm contract entry-points (Rust)
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult};

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Transfer { recipient, amount } => {
            // ... transfer logic
            Ok(Response::default())
        }
    }
}`,
  polkadot: `// ink! PSP-22 token (Polkadot)
#[ink::contract]
mod my_token {
    #[ink(storage)]
    pub struct MyToken {
        total_supply: Balance,
        balances: ink::storage::Mapping<AccountId, Balance>,
    }

    impl MyToken {
        #[ink(constructor)]
        pub fn new(total_supply: Balance) -> Self { /* ... */ Self { total_supply, balances: Default::default() } }

        #[ink(message)]
        pub fn transfer(&mut self, to: AccountId, value: Balance) -> bool { /* ... */ true }
    }
}`,
};

/* ── severity / verdict helpers ── */
const SEV_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(229,72,77,0.12)",  text: "#f47174", border: "rgba(229,72,77,0.28)" },
  high:     { bg: "rgba(245,165,36,0.12)", text: "#f5a524", border: "rgba(245,165,36,0.26)" },
  medium:   { bg: "rgba(234,179,8,0.10)",  text: "#eab308", border: "rgba(234,179,8,0.24)" },
  low:      { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "rgba(99,102,241,0.28)" },
  info:     { bg: "rgba(141,145,153,0.12)",text: "var(--text-muted)", border: "rgba(141,145,153,0.22)" },
};
const sevStyle = (s: string) => SEV_STYLES[s?.toLowerCase()] ?? SEV_STYLES.info;

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  SAFE:    { bg: "rgba(46,189,107,0.12)", text: "#2ebd6b", border: "rgba(46,189,107,0.28)" },
  CAUTION: { bg: "rgba(245,165,36,0.12)", text: "#f5a524", border: "rgba(245,165,36,0.26)" },
};
const verdictStyle = (v: string) =>
  VERDICT_STYLES[v?.toUpperCase()] ?? { bg: "rgba(229,72,77,0.12)", text: "#f47174", border: "rgba(229,72,77,0.28)" };

/* ── inline style helpers ── */
const inputBase: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "var(--background)",
  border: "1px solid var(--input)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontFamily: "'Satoshi', sans-serif",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s",
};

const BASE_AUDIT_STEPS = [
  { id: "init",        label: "Initializing agents..." },
  { id: "reentrancy",  label: "Scanning for reentrancy..." },
  { id: "access",      label: "Checking access control..." },
  { id: "overflow",    label: "Testing integer overflow..." },
  { id: "logic",       label: "Analyzing business logic..." },
  { id: "defi",        label: "Detecting DeFi vulnerabilities..." },
  { id: "backdoor",    label: "Scanning for backdoors..." },
  { id: "signature",   label: "Verifying signatures..." },
  { id: "orchestrator",label: "AI orchestrator analysis..." },
  { id: "report",      label: "Generating report..." },
];

export default function ScanPage() {
  const { data: session, update } = useSession();
  const [code, setCode]                 = useState("");
  const [name, setName]                 = useState("");
  const [chain, setChain]               = useState("ethereum");
  const [standards, setStandards]       = useState<string[]>([]);
  const [stdOpen, setStdOpen]           = useState(false);
  const [scanning, setScanning]         = useState(false);

  // Standards available on the currently-selected chain. Resets when chain changes.
  const availableStandards = React.useMemo(() => standardsForChain(chain), [chain]);
  const chainConfig = getChain(chain);

  // When the chain changes, drop any previously-selected standards that don't
  // apply to the new chain (e.g. ERC-20 if the user switches to TON).
  useEffect(() => {
    setStandards(prev => prev.filter(id => availableStandards.some(s => s.id === id)));
    setStdOpen(false);
  }, [chain, availableStandards]);

  const toggleStandard = (id: string) =>
    setStandards(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  const [result, setResult]       = useState<AuditResult | null>(null);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [auditsLeft, setAuditsLeft] = useState<number | null>(null);
  const [userPlan, setUserPlan]   = useState<string>("free");
  
  // ⭐ NEW: Async polling state
  const [jobId, setJobId]         = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [slowWarning, setSlowWarning] = useState(false);
  const pollCountRef = React.useRef(0);

  const AUDIT_STEPS = React.useMemo(() => {
    const stdSteps = standards.map(id => ({
      id,
      label: `Checking ${availableStandards.find(s => s.id === id)?.label ?? id} compliance...`,
    }));
    return [...BASE_AUDIT_STEPS.slice(0, 8), ...stdSteps, ...BASE_AUDIT_STEPS.slice(8)];
  }, [standards, availableStandards]);

  useEffect(() => { fetchLimits(); }, []);

  const fetchLimits = async () => {
    try {
      const res  = await fetch("/api/user/limits");
      const data = await res.json();
      if (res.ok) { setAuditsLeft(data.remaining); setUserPlan(data.plan?.toLowerCase() ?? "free"); }
    } catch { /* silent */ }
  };

  const runScan = async () => {
    if (!code.trim()) { setError(`Please paste your ${chainConfig?.label ?? "contract"} code first.`); return; }
    if (userPlan === "free" && auditsLeft !== null && auditsLeft <= 0) {
      setError("You've reached your audit limit. Upgrade your plan to continue."); return;
    }

    setError("");
    setResult(null);
    setScanning(true);
    setJobId(null);
    setProgress(0);
    setCurrentStep(0);
    setSlowWarning(false);
    pollCountRef.current = 0;

    try {
      const res = await fetch("/api/audit/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_code: code,
          contract_name: name || "Smart Contract",
          chain,
          standards,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Scan failed.");
      }
      
      // ⭐ Check if this is an async response (202 Accepted)
      if (res.status === 202 && data.job_id) {
        setJobId(data.job_id);
        startPolling(data.job_id);
      } else {
        // Sync response (legacy/fallback)
        setResult(data);
        setScanning(false);
        await fetchLimits();
        await update();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setScanning(false);
    }
  };

  const startPolling = (auditJobId: string) => {
    const startTime = Date.now();
    
    const pollInterval = setInterval(async () => {
      pollCountRef.current += 1;

      // After ~90s (30 polls) show a soft "still running" warning — don't give up yet
      if (pollCountRef.current === 30) {
        setSlowWarning(true);
      }

      // Hard stop at 5 minutes (100 × 3s = 300s) — rare but covers Groq retry storms
      if (pollCountRef.current > 100) {
        clearInterval(pollInterval);
        setError("Audit is taking longer than expected. It may still be running — check History for results.");
        setScanning(false);
        setJobId(null);
        setSlowWarning(false);
        return;
      }

      // Progress animation: slow down after 90% so it never falsely hits 100
      const elapsed = Date.now() - startTime;
      const estimatedProgress = Math.min(90, Math.floor(elapsed / 750));
      setProgress(estimatedProgress);
      setCurrentStep((prev) => {
        const next = Math.floor(estimatedProgress / 10);
        return next > prev && next < AUDIT_STEPS.length ? next : prev;
      });

      try {
        const response = await fetch(`/api/audit/results/${auditJobId}?poll=true`);
        const data = await response.json();

        if (data.status === "COMPLETED") {
          clearInterval(pollInterval);
          setProgress(100);
          setCurrentStep(AUDIT_STEPS.length);

          const fullResponse = await fetch(`/api/audit/results/${auditJobId}`);
          const fullData = await fullResponse.json();

          setResult(fullData);
          setScanning(false);
          setJobId(null);
          await fetchLimits();
          await update();
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setError("Audit processing failed. Please try again.");
          setScanning(false);
          setJobId(null);
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Continue polling on transient network errors
      }
    }, 3000);

    // Cleanup
    return () => clearInterval(pollInterval);
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

  // ⭐ Show progress UI when scanning with jobId
  if (scanning && jobId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="scan-header">
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.06em", color: "var(--brand)" }}>
            ● RUNNING
          </span>
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Scanning…
          </h1>
        </div>

        {/* Slow-audit soft warning — shown after ~90s, does NOT stop polling */}
        {slowWarning && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Clock className="h-4 w-4 mt-0.5" style={{ color: "#ca8a04", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, color: "#ca8a04", fontFamily: "'Satoshi', sans-serif" }}>
                Still processing — this is taking a bit longer than usual
              </p>
              <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
                Complex contracts can take up to 5 minutes. Hanging on…{" "}
                <Link href="/dashboard/history" style={{ color: "var(--brand)" }}>
                  View History
                </Link>{" "}
                if you need to navigate away.
              </p>
            </div>
          </div>
        )}

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(20px, 5vw, 32px)", boxShadow: "var(--shadow-card)" }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>Audit in progress</span>
              <span style={{ fontSize: 28, fontWeight: 500, fontFamily: "'DM Mono', monospace", color: "var(--text-primary)" }}>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--primary)", borderRadius: 99, transition: "width 0.3s ease" }} />
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {AUDIT_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isRunning = index === currentStep;
              
              return (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#10b981" }} />
                  ) : isRunning ? (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" style={{ color: "#3b82f6" }} />
                  ) : (
                    <Circle className="h-4 w-4 flex-shrink-0" style={{ color: "var(--border)" }} />
                  )}
                  <span style={{ 
                    fontSize: "clamp(12px, 3vw, 13px)", 
                    color: isCompleted ? "#10b981" : isRunning ? "#3b82f6" : "var(--text-muted)",
                    fontFamily: "'Satoshi', sans-serif",
                  }}>
                    {step.label}
                  </span>
                  {isRunning && (
                    <span style={{ marginLeft: "auto", fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-disabled)" }} className="animate-pulse">
                      processing...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 20, fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-disabled)", textAlign: "center", fontFamily: "'Satoshi', sans-serif" }}>
            Estimated time: ~45 seconds
          </p>
        </div>
      </div>
    );
  }

  // Original UI (form and results)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @media (max-width: 640px) {
          .scan-header { flex-direction: column !important; align-items: flex-start !important; }
          .config-grid { grid-template-columns: 1fr !important; }
          .findings-header { flex-direction: column !important; align-items: flex-start !important; }
          .severity-badges { flex-wrap: wrap !important; }
        }
      `}</style>

      {/* Header */}
      <div className="scan-header">
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          NEW AUDIT
        </span>
        <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
          Scan a contract
        </h1>
      </div>

      {/* Quota warning */}
      {userPlan === "free" && auditsLeft !== null && auditsLeft <= 2 && auditsLeft > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertTriangle className="h-4 w-4 mt-0.5" style={{ color: "#ca8a04", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, color: "#ca8a04", fontFamily: "'Satoshi', sans-serif" }}>Limited audits remaining</p>
            <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
              {auditsLeft} audit{auditsLeft !== 1 ? "s" : ""} remaining this month.{" "}
              <Link href="/dashboard/billing" prefetch={true} style={{ color: "var(--brand)", textDecoration: "underline" }}>Upgrade</Link>
            </p>
          </div>
        </div>
      )}

      {limitReached && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: "#ef4444", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>Audit limit reached</p>
            <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
              <Link href="/dashboard/billing" prefetch={true} style={{ color: "var(--brand)", textDecoration: "underline" }}>Upgrade your plan</Link> to run more audits.
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(20px, 5vw, 28px)", boxShadow: "var(--shadow-card)" }}>
        <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 20 }}>Configuration</h3>

        <div className="config-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contract Name</label>
            <input style={inputBase} type="text" placeholder="MyToken" value={name} onChange={e => setName(e.target.value)}
              onFocus={e => (e.target.style.borderColor = "var(--brand)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Blockchain Network</label>
            <select style={{ ...inputBase, cursor: "pointer" }} value={chain} onChange={e => setChain(e.target.value)}>
              {CHAINS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contract Standards Selector — populated based on selected chain */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Contract Standards{chainConfig ? ` · ${chainConfig.label}` : ""}
          </label>
          <button
            type="button"
            onClick={() => setStdOpen(o => !o)}
            disabled={availableStandards.length === 0}
            style={{
              ...inputBase,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: availableStandards.length === 0 ? "not-allowed" : "pointer",
              textAlign: "left",
              opacity: availableStandards.length === 0 ? 0.6 : 1,
              borderColor: stdOpen ? "var(--brand)" : "var(--border)",
            }}
          >
            <span style={{ color: standards.length ? "var(--text-primary)" : "var(--text-disabled)" }}>
              {availableStandards.length === 0
                ? "No standards available for this chain"
                : standards.length === 0
                  ? "None — select standards to enable specialist agents"
                  : standards.map(id => availableStandards.find(s => s.id === id)?.label).join(", ")}
            </span>
            <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)", flexShrink: 0, transform: stdOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {stdOpen && availableStandards.length > 0 && (
            <div style={{
              marginTop: 4, background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}>
              {availableStandards.map((std, i) => {
                const selected = standards.includes(std.id);
                return (
                  <label
                    key={std.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", cursor: "pointer",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      background: selected ? "var(--brand-faint)" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleStandard(std.id)}
                      style={{ accentColor: "var(--brand)", width: 14, height: 14, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: selected ? 600 : 400, color: selected ? "var(--brand)" : "var(--text-primary)", fontFamily: "'Satoshi', sans-serif" }}>
                        {std.label}
                      </span>
                      <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", marginLeft: 8 }}>
                        {std.desc}
                      </span>
                    </div>
                    {selected && (
                      <span style={{ fontSize: "clamp(9px, 2vw, 10px)", padding: "1px 7px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "var(--brand)", fontFamily: "'Satoshi', sans-serif", fontWeight: 600 }}>
                        active
                      </span>
                    )}
                  </label>
                );
              })}
              {standards.length > 0 && (
                <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", background: "var(--elevated)" }}>
                  <button
                    type="button"
                    onClick={() => setStandards([])}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "clamp(10px, 2.5vw, 11px)", cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
            <label style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {chainConfig ? `${chainConfig.label} Source / Payload` : "Source Code"}
            </label>
            <button onClick={() => setCode(SAMPLE_BY_CHAIN[chain] ?? SAMPLE_CONTRACT)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--brand)", fontSize: "clamp(11px, 2.5vw, 12px)", cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}>
              <FileCode className="h-3 w-3" /> Load Sample
            </button>
          </div>
          <textarea
            rows={12}
            placeholder={SAMPLE_BY_CHAIN[chain] ?? "// Paste your contract code here"}
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{ ...inputBase, fontFamily: "'Satoshi', monospace", resize: "vertical", minHeight: "clamp(200px, 40vh, 240px)" }}
            onFocus={e => (e.target.style.borderColor = "var(--brand)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")}
          />
          <p style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: code.length > 50000 ? "#ef4444" : "var(--text-disabled)", marginTop: 4, fontFamily: "'Satoshi', sans-serif" }}>
            {code.length.toLocaleString()} / 50,000 characters
            {code.length > 50000 && " (Exceeds limit!)"}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "#ef4444", fontFamily: "'Satoshi', sans-serif", flex: 1 }}>
              {error.includes("History") ? (
                <>
                  Audit is taking longer than expected. It may still be running —{" "}
                  <Link href="/dashboard/history" style={{ color: "#ef4444", textDecoration: "underline" }}>
                    check History for results
                  </Link>.
                </>
              ) : error}
            </span>
          </div>
        )}

        <button
          onClick={runScan}
          disabled={scanning || limitReached || code.length > 50000}
          style={{
            width: "100%", height: 52,
            background: scanning || limitReached || code.length > 50000 ? "var(--surface-3)" : "var(--primary)",
            color: scanning || limitReached || code.length > 50000 ? "var(--text-disabled)" : "var(--primary-foreground)",
            border: "none", borderRadius: "var(--radius-md)", fontFamily: "'Satoshi', sans-serif",
            fontSize: 16, fontWeight: 600, cursor: scanning || limitReached || code.length > 50000 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.15s",
          }}
        >
          {scanning ? <><Loader2 className="h-5 w-5 animate-spin" /> Scanning…</> : <><Shield className="h-5 w-5" /> Run Audit</>}
        </button>
      </div>

      {/* Results - ONLY show if result exists AND has findings */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">

          {/* Summary */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(16px, 4vw, 24px)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "clamp(12px, 3vw, 16px)", alignItems: "center", flexWrap: "wrap" }}>
                {/* Score ring */}
                <div style={{ width: 84, height: 84, borderRadius: "50%", border: `3px solid ${verdictStyle(result.deployment_verdict).border}`, background: verdictStyle(result.deployment_verdict).bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: verdictStyle(result.deployment_verdict).text }}>{result.risk_score}</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{result.contract_name}</h3>
                    <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 600, fontFamily: "'Satoshi', sans-serif", ...verdictStyle(result.deployment_verdict), border: `1px solid ${verdictStyle(result.deployment_verdict).border}` }}>
                      {result.deployment_verdict}
                    </span>
                  </div>
                  <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", maxWidth: 420 }}>{result.summary}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {result.pdf_available && (
                  <button onClick={downloadPdf} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "clamp(11px, 2.5vw, 12px)", cursor: "pointer", fontFamily: "'Satoshi', sans-serif", transition: "color 0.15s" }}>
                    <Download className="h-3 w-3" /> PDF
                  </button>
                )}
                <button onClick={copyFindings} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "clamp(11px, 2.5vw, 12px)", cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}>
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            </div>

            {/* Counts */}
            <div className="severity-badges" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Critical", count: result.critical_count, ...SEV_STYLES.critical },
                { label: "High",     count: result.high_count,     ...SEV_STYLES.high },
                { label: "Medium",   count: result.medium_count,   ...SEV_STYLES.medium },
                { label: "Low",      count: result.low_count,      ...SEV_STYLES.low },
                { label: "Info",     count: result.info_count,     ...SEV_STYLES.info },
              ].map(({ label, count, bg, text, border }) => (
                <span key={label} style={{ padding: "3px 10px", borderRadius: 6, fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 500, fontFamily: "'Satoshi', sans-serif", background: bg, color: text, border: `1px solid ${border}` }}>
                  {count} {label}
                </span>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", marginLeft: 4 }}>
                <Clock className="h-3 w-3" />
                {(result.scan_duration_ms / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Findings - ⭐ SAFE CHECK: Only render if findings exists AND is an array */}
          {result.findings && Array.isArray(result.findings) && result.findings.length > 0 && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
              <div className="findings-header" style={{ padding: "clamp(14px, 4vw, 18px) clamp(16px, 4vw, 24px)", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                  Findings <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {result.total_findings}</span>
                </h3>
              </div>
              <div style={{ padding: "clamp(16px, 4vw, 24px)", display: "flex", flexDirection: "column", gap: 10 }}>
                {result.findings.map((finding, idx) => {
                  const isOpen = expanded === idx;
                  const ss = sevStyle(finding.severity);
                  return (
                    <div key={idx} style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : idx)}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "clamp(12px, 3vw, 14px) clamp(12px, 3vw, 16px)", display: "flex", alignItems: "flex-start", gap: 10 }}
                      >
                        <span style={{ padding: "2px 9px", borderRadius: 5, fontSize: "clamp(9px, 2vw, 10px)", fontWeight: 600, fontFamily: "'Satoshi', sans-serif", letterSpacing: "0.05em", background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`, flexShrink: 0 }}>
                          {finding.severity?.toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 500, color: "var(--text-primary)", fontFamily: "'Satoshi', sans-serif", marginBottom: 2 }}>{finding.type}</p>
                          {finding.function && (
                            <p style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontFamily: "'Satoshi', monospace" }}>
                              {finding.function}{finding.line && ` · line ${finding.line}`}
                            </p>
                          )}
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                      </button>

                      {isOpen && (
                        <div style={{ borderTop: "1px solid var(--border)", padding: "clamp(12px, 3vw, 16px)", background: "var(--elevated)", display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <p style={{ fontSize: "clamp(9px, 2vw, 10px)", fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'Satoshi', sans-serif" }}>Description</p>
                            <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif", lineHeight: 1.65 }}>{finding.description}</p>
                          </div>
                          {finding.recommendation && (
                            <div style={{ padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.15)" }}>
                              <p style={{ fontSize: "clamp(9px, 2vw, 10px)", fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'Satoshi', sans-serif" }}>Recommendation</p>
                              <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif", lineHeight: 1.65 }}>{finding.recommendation}</p>
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