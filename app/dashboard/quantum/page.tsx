"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Atom, AlertCircle, Loader2, CheckCircle2, Circle,
  ChevronDown, ChevronUp, Zap, Lock, TrendingUp,
  Copy, Clock, Cpu, Layers, GitMerge, BarChart2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface SubResult {
  vulnerability: string;
  risk_score: number;
  severity: string;
  method: string;
  n_qubits: number;
  shots: number;
  backend: string;
}

interface QuantumResult {
  audit_id: string;
  vulnerability: string;
  risk_score: number;
  severity: string;
  method: string;
  timestamp: string;
  sub_results: SubResult[];
}

// ── Display helpers ────────────────────────────────────────────────────────
const VULN_LABELS: Record<string, string> = {
  reentrancy_pattern:       "Reentrancy Pattern",
  access_control_weakness:  "Access Control Weakness",
  integer_overflow:         "Integer Overflow",
  flash_loan_exposure:      "Flash Loan Exposure",
  none_detected:            "None Detected",
};
const vulnLabel = (v: string) => VULN_LABELS[v] ?? v;

const METHOD_LABELS: Record<string, string> = {
  ibm_grover_scan:           "IBM Grover Scan",
  ibm_quantum_risk_scorer:   "IBM VQC Risk Scorer",
  braket_grover_scan:        "Braket Grover Scan",
  braket_quantum_risk_scorer:"Braket VQC Risk Scorer",
  aggregated_ibm_braket:     "Aggregated (IBM + Braket)",
};
const methodLabel = (m: string) => METHOD_LABELS[m] ?? m;

const SEV_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", border: "rgba(239,68,68,0.25)" },
  high:     { bg: "rgba(249,115,22,0.1)",  text: "#f97316", border: "rgba(249,115,22,0.25)" },
  medium:   { bg: "rgba(234,179,8,0.1)",   text: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  low:      { bg: "rgba(59,130,246,0.1)",  text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  none:     { bg: "rgba(107,114,128,0.1)", text: "var(--text-muted)", border: "rgba(107,114,128,0.2)" },
};
const sevStyle = (s: string) => SEV_STYLES[s?.toLowerCase()] ?? SEV_STYLES.none;

const scoreColor = (s: number) => {
  if (s >= 0.8) return "#ef4444";
  if (s >= 0.6) return "#f97316";
  if (s >= 0.4) return "#ca8a04";
  if (s >= 0.2) return "#3b82f6";
  return "#10b981";
};

const inputBase: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "var(--elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(12px,3vw,13px)",
  outline: "none", transition: "border-color 0.15s",
};

// ── Quantum circuit steps ──────────────────────────────────────────────────
const QUANTUM_STEPS = [
  { id: "connect",   label: "Connecting to quantum engine..." },
  { id: "ibm_g",    label: "Running IBM Grover vulnerability scan..." },
  { id: "ibm_vqc",  label: "Running IBM VQC risk scorer..." },
  { id: "braket_g",  label: "Running Braket Grover scan..." },
  { id: "braket_v",  label: "Running Braket VQC risk scorer..." },
  { id: "aggregate", label: "Aggregating quantum results..." },
];

// ── Upgrade Gate ───────────────────────────────────────────────────────────
function UpgradeGate() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Atom size={22} style={{ color: "#a855f7" }} />
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(22px,6vw,28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
            Quantum Audit
          </h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
            Beta
          </span>
        </div>
        <p style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
          Quantum-powered vulnerability detection using IBM Qiskit and AWS Braket circuits.
        </p>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
        {/* Gradient banner */}
        <div style={{ padding: "clamp(28px,6vw,40px) clamp(20px,5vw,32px)", background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,212,255,0.05))", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,212,255,0.1))", border: "1px solid rgba(168,85,247,0.25)" }}>
            <Lock size={28} style={{ color: "#a855f7" }} />
          </div>
          <h2 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(18px,5vw,22px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 8 }}>
            Pro Plan Required
          </h2>
          <p style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif", maxWidth: 480, margin: "0 auto" }}>
            Quantum auditing uses IBM AerSimulator and AWS Braket LocalSimulator circuits running in parallel
            to detect vulnerabilities via Grover&apos;s algorithm and variational quantum circuits.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ padding: "clamp(20px,5vw,28px) clamp(20px,5vw,32px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { icon: Cpu,       title: "Grover's Algorithm",   desc: "Quadratic speedup for vulnerability pattern search in contract bytecode" },
              { icon: Layers,    title: "Variational QC (VQC)", desc: "Two-layer RY/RZ circuit scores transaction risk with quantum probability" },
              { icon: GitMerge,  title: "Dual-Backend Parallel",desc: "IBM Qiskit and AWS Braket circuits run simultaneously for consensus" },
              { icon: BarChart2, title: "Unified Risk Score",   desc: "Weighted aggregation: 70% worst-case + 30% average across all 4 circuits" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--elevated)", border: "1px solid var(--border)" }}>
                  <Icon size={16} style={{ color: "#a855f7", marginBottom: 8 }} />
                  <div style={{ fontSize: "clamp(12px,3vw,13px)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, fontFamily: "'Satoshi', sans-serif" }}>{f.title}</div>
                  <div style={{ fontSize: "clamp(11px,2.5vw,12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>

          <Link href="/dashboard/billing" prefetch={true}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            <TrendingUp size={15} />
            Upgrade to Pro
          </Link>
          <p style={{ textAlign: "center", fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-disabled)", marginTop: 10, fontFamily: "'Satoshi', sans-serif" }}>
            Quantum auditing is available on Pro and Enterprise plans.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function QuantumPage() {
  const [userPlan, setUserPlan]         = useState<string | null>(null);
  const [bytecode, setBytecode]         = useState("0x608060405234801561001057600080fd5b50");
  const [txData, setTxData]             = useState("from=0xabc123,to=0xdef456,value=1000000000000000000");
  const [nQubits, setNQubits]           = useState(4);
  const [shots, setShots]               = useState(1024);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [running, setRunning]           = useState(false);
  const [currentStep, setCurrentStep]   = useState(0);
  const [progress, setProgress]         = useState(0);
  const [result, setResult]             = useState<QuantumResult | null>(null);
  const [error, setError]               = useState("");
  const [expanded, setExpanded]         = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/user/limits")
      .then((r) => r.json())
      .then((d) => setUserPlan((d.plan || "free").toUpperCase()))
      .catch(() => setUserPlan("FREE"));
  }, []);

  // Simulate step progress while the fetch is in-flight
  const startProgress = () => {
    const start = Date.now();
    const totalMs = 110_000; // assume ~110s worst case
    setCurrentStep(0);
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct     = Math.min(95, (elapsed / totalMs) * 100);
      setProgress(Math.floor(pct));
      // Each step covers ~16% progress (6 steps over 100%)
      const step = Math.min(QUANTUM_STEPS.length - 1, Math.floor(pct / 16));
      setCurrentStep(step);
    }, 1000);
  };

  const stopProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setCurrentStep(QUANTUM_STEPS.length);
  };

  const runAudit = async () => {
    if (!bytecode.trim()) { setError("Please enter contract bytecode or Solidity source."); return; }
    if (!txData.trim())   { setError("Please enter transaction data."); return; }
    if (nQubits < 2 || nQubits > 10) { setError("n_qubits must be between 2 and 10."); return; }
    if (shots < 100 || shots > 10000) { setError("shots must be between 100 and 10,000."); return; }

    setError("");
    setResult(null);
    setRunning(true);
    startProgress();

    try {
      const res = await fetch("/api/quantum/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_bytecode: bytecode,
          transaction_data:  txData,
          use_real_hardware: false,
          n_qubits:          nQubits,
          shots,
        }),
      });

      const data = await res.json();
      stopProgress();

      if (!res.ok) {
        throw new Error(data.error || "Quantum audit failed.");
      }
      setResult(data as QuantumResult);
    } catch (err) {
      stopProgress();
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const copyResult = () => {
    if (result) navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  // Loading state while plan is being fetched
  if (userPlan === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  // Plan gate disabled — available to all users for now

  // Running state — full-screen progress
  if (running) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Atom size={20} style={{ color: "#a855f7" }} />
            <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(22px,6vw,28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
              Quantum Audit Running
            </h1>
          </div>
          <p style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
            IBM and Braket circuits are running in parallel on the quantum engine...
          </p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(20px,5vw,32px)", boxShadow: "var(--shadow-card)" }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(11px,2.5vw,12px)", color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Satoshi', sans-serif" }}>
              <span>Quantum circuits running</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--elevated)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7, #06b6d4)", borderRadius: 2, transition: "width 0.8s ease" }} />
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {QUANTUM_STEPS.map((step, idx) => {
              const done    = idx < currentStep;
              const running = idx === currentStep;
              return (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {done ? (
                    <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                  ) : running ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: "#a855f7", flexShrink: 0 }} />
                  ) : (
                    <Circle size={16} style={{ color: "var(--border)", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: "clamp(12px,3vw,13px)", color: done ? "#10b981" : running ? "#a855f7" : "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
                    {step.label}
                  </span>
                  {running && (
                    <span className="animate-pulse" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>
                      processing...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 20, fontSize: "clamp(11px,2.5vw,12px)", color: "var(--text-disabled)", textAlign: "center", fontFamily: "'Satoshi', sans-serif" }}>
            Estimated time: 30 – 120 seconds depending on qubit count
          </p>
        </div>
      </div>
    );
  }

  // Main UI — form + results
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Atom size={20} style={{ color: "#a855f7" }} />
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(22px,6vw,28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
            Quantum Audit
          </h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
            Beta
          </span>
        </div>
        <p style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
          IBM AerSimulator + AWS Braket LocalSimulator — four circuits running in parallel.
        </p>
      </div>

      {/* Info banner */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Zap size={15} style={{ color: "#a855f7", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: "clamp(11px,2.5vw,12px)", color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif", lineHeight: 1.6 }}>
          Grover&apos;s algorithm scans bytecode for reentrancy and access-control patterns.
          The VQC risk scorer maps transaction data to rotation angles and measures qubit-majority probability.
          All circuits run on free simulators — no cloud costs incurred.
        </p>
      </div>

      {/* Form card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(20px,5vw,28px)", boxShadow: "var(--shadow-card)" }}>
        <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(14px,4vw,16px)", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 4 }}>
          Audit Configuration
        </h3>
        <p style={{ fontSize: "clamp(11px,3vw,12px)", color: "var(--text-muted)", marginBottom: 20, fontFamily: "'Satoshi', sans-serif" }}>
          Provide contract bytecode and transaction metadata for quantum analysis.
        </p>

        {/* Bytecode */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Contract Bytecode / Source
          </label>
          <textarea
            rows={5}
            placeholder="0x608060405234801561001057600080fd5b50  or paste Solidity source"
            value={bytecode}
            onChange={(e) => setBytecode(e.target.value)}
            style={{ ...inputBase, fontFamily: "monospace", resize: "vertical", minHeight: 90 }}
            onFocus={(e) => (e.target.style.borderColor = "#a855f7")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Transaction data */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Transaction Data
          </label>
          <input
            type="text"
            placeholder="from=0xabc123,to=0xdef456,value=1000000000000000000"
            value={txData}
            onChange={(e) => setTxData(e.target.value)}
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = "#a855f7")}
            onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          />
          <p style={{ marginTop: 4, fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>
            Key=value pairs describing the transaction (used by the VQC risk scorer).
          </p>
        </div>

        {/* Advanced settings toggle */}
        <button
          onClick={() => setShowAdvanced((p) => !p)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "clamp(11px,2.5vw,12px)", fontFamily: "'Satoshi', sans-serif", marginBottom: showAdvanced ? 14 : 0, padding: 0 }}
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Advanced settings
        </button>

        {showAdvanced && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16, padding: "16px", background: "var(--elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div>
              <label style={{ display: "block", fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                n_qubits (2 – 10)
              </label>
              <input
                type="number" min={2} max={10}
                value={nQubits}
                onChange={(e) => setNQubits(Math.min(10, Math.max(2, Number(e.target.value))))}
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#a855f7")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
              />
              <p style={{ marginTop: 4, fontSize: 10, color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>IBM circuits only — Braket caps at 3 internally.</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Shots (100 – 10,000)
              </label>
              <input
                type="number" min={100} max={10000} step={100}
                value={shots}
                onChange={(e) => setShots(Math.min(10000, Math.max(100, Number(e.target.value))))}
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#a855f7")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
              />
              <p style={{ marginTop: 4, fontSize: 10, color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>Measurement shots per circuit. Higher = more accurate.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: "clamp(12px,3vw,13px)", color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>{error}</span>
          </div>
        )}

        <button
          onClick={runAudit}
          disabled={running}
          style={{
            width: "100%", padding: "clamp(10px,3vw,12px) 0",
            background: running ? "var(--elevated)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: running ? "var(--text-disabled)" : "#fff",
            border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif",
            fontSize: "clamp(13px,3vw,14px)", fontWeight: 600, cursor: running ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity 0.15s",
          }}
        >
          {running
            ? <><Loader2 size={15} className="animate-spin" /> Running quantum circuits…</>
            : <><Atom size={15} /> Run Quantum Audit</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">
          {/* Top-level result */}
          <div style={{ background: "var(--card)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "var(--radius-md)", padding: "clamp(16px,4vw,24px)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                {/* Score circle */}
                <div style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${scoreColor(result.risk_score)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${scoreColor(result.risk_score)}10` }}>
                  <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 18, fontWeight: 800, color: scoreColor(result.risk_score) }}>
                    {result.risk_score.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(16px,4vw,20px)", fontWeight: 700, color: "var(--text-primary)" }}>
                      {vulnLabel(result.vulnerability)}
                    </h3>
                    <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: "clamp(10px,2.5vw,11px)", fontWeight: 600, fontFamily: "'Satoshi', sans-serif", ...sevStyle(result.severity), border: `1px solid ${sevStyle(result.severity).border}` }}>
                      {result.severity.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: "clamp(11px,2.5vw,12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
                    {methodLabel(result.method)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>
                    <Clock size={11} />
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={copyResult}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius)", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "clamp(11px,2.5vw,12px)", cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}
              >
                <Copy size={12} /> Copy JSON
              </button>
            </div>

            {/* Aggregate formula note */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>
              Score = 0.7 × max_circuit_score + 0.3 × avg_circuit_score · Audit ID: {result.audit_id}
            </div>
          </div>

          {/* Sub-results */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
            <div style={{ padding: "clamp(14px,4vw,18px) clamp(16px,4vw,24px)", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(14px,4vw,16px)", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 2 }}>
                Circuit Breakdown
              </h3>
              <p style={{ fontSize: "clamp(11px,3vw,12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
                {result.sub_results.length} circuits ran in parallel
              </p>
            </div>

            <div style={{ padding: "clamp(16px,4vw,24px)", display: "flex", flexDirection: "column", gap: 10 }}>
              {result.sub_results.map((sub, idx) => {
                const isOpen = expanded === idx;
                const ss     = sevStyle(sub.severity);
                return (
                  <div key={idx} style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : idx)}
                      style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "clamp(12px,3vw,14px) clamp(12px,3vw,16px)", display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ padding: "2px 9px", borderRadius: 5, fontSize: "clamp(9px,2vw,10px)", fontWeight: 600, fontFamily: "'Satoshi', sans-serif", letterSpacing: "0.05em", ...ss, border: `1px solid ${ss.border}`, flexShrink: 0 }}>
                        {sub.severity.toUpperCase()}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "clamp(12px,3vw,13px)", fontWeight: 500, color: "var(--text-primary)", fontFamily: "'Satoshi', sans-serif", marginBottom: 2 }}>
                          {methodLabel(sub.method)}
                        </p>
                        <p style={{ fontSize: "clamp(10px,2.5vw,11px)", color: "var(--text-muted)", fontFamily: "'Satoshi', monospace" }}>
                          {sub.backend} · {sub.n_qubits} qubits · {sub.shots} shots
                        </p>
                      </div>
                      <span style={{ fontSize: "clamp(13px,3vw,15px)", fontWeight: 700, color: scoreColor(sub.risk_score), fontFamily: "'Satoshi', sans-serif", flexShrink: 0, marginRight: 8 }}>
                        {sub.risk_score.toFixed(4)}
                      </span>
                      {isOpen ? <ChevronUp size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "clamp(12px,3vw,16px)", background: "var(--elevated)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                        {[
                          { label: "Vulnerability",  value: vulnLabel(sub.vulnerability) },
                          { label: "Risk Score",     value: sub.risk_score.toFixed(6) },
                          { label: "Severity",       value: sub.severity.toUpperCase() },
                          { label: "Backend",        value: sub.backend },
                          { label: "Qubits",         value: String(sub.n_qubits) },
                          { label: "Shots",          value: sub.shots.toLocaleString() },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3, fontFamily: "'Satoshi', sans-serif" }}>{label}</p>
                            <p style={{ fontSize: "clamp(11px,2.5vw,12px)", color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif" }}>{value}</p>
                          </div>
                        ))}
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
  );
}
