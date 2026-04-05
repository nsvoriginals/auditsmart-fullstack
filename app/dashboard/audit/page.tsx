"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, AlertCircle, CheckCircle, Zap, Shield, Brain, Sparkles, AlertTriangle } from "lucide-react";

const PLANS = [
  { id: "free", name: "Free", price: "$0", icon: Shield, features: ["3 audits/month", "Basic security checks", "Gemini AI", "8 specialized agents"] },
  { id: "pro", name: "Pro", price: "$12", icon: Zap, features: ["10 audits/month", "Fix suggestions", "Claude Haiku", "Priority queue"], popular: true },
  { id: "enterprise", name: "Enterprise", price: "$60", icon: Brain, features: ["Unlimited audits", "Exploit scenarios", "Claude Sonnet", "24/7 support"] },
  { id: "deep_audit", name: "Deep Audit", price: "$20", icon: Sparkles, features: ["Claude Opus", "Extended thinking", "Exploit scenarios", "PDF report"] },
];

interface UserLimits {
  plan: string; auditsThisMonth: number; limit: number | null;
  remaining: number | null; canAudit: boolean; isUnlimited: boolean;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
  .audit-root { font-family: 'DM Mono', monospace; color: #f0f0f5; }
  .page-header { margin-bottom: 32px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f0f0f5; letter-spacing: -0.5px; }
  .page-sub { font-size: 12px; color: #6b6b85; margin-top: 6px; }
  .audit-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
  .card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 14px; padding: 28px; }
  .card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #e0e0f0; margin-bottom: 24px; }
  .field { margin-bottom: 20px; }
  .field label { display: block; font-size: 10px; color: #6b6b85; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
  .field input, .field textarea {
    width: 100%; padding: 11px 14px; background: #111118;
    border: 1px solid #1e1e2e; border-radius: 8px;
    color: #f0f0f5; font-family: 'DM Mono', monospace; font-size: 12px;
    outline: none; transition: border-color 0.15s; resize: vertical;
  }
  .field input:focus, .field textarea:focus { border-color: #6366f1; }
  .field input::placeholder, .field textarea::placeholder { color: #3a3a55; }
  .field textarea { line-height: 1.7; min-height: 280px; }
  .btn-run {
    width: 100%; padding: 13px; background: #6366f1; color: #fff;
    border: none; border-radius: 8px; font-family: 'DM Mono', monospace;
    font-size: 13px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s; margin-top: 24px;
  }
  .btn-run:hover { background: #5254cc; }
  .btn-run:disabled { opacity: 0.4; cursor: not-allowed; }
  .alert-box { border-radius: 10px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; font-size: 12px; }
  .alert-warn { background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.15); color: #fbbf24; }
  .alert-ok { background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.15); color: #6ee7b7; }
  .alert-err { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); color: #fca5a5; }
  .alert-info { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); color: #a5b4fc; }
  .progress-bar-bg { background: rgba(99,102,241,0.15); height: 2px; border-radius: 2px; overflow: hidden; margin-top: 8px; }
  .progress-bar-fill { height: 2px; background: #6ee7b7; border-radius: 2px; transition: width 0.3s; }
  .plans-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #e0e0f0; margin-bottom: 14px; }
  .plan-option { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 10px; padding: 16px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s; position: relative; }
  .plan-option.selected { border-color: #6366f1; background: rgba(99,102,241,0.04); }
  .plan-option:hover:not(.selected) { border-color: #2e2e45; }
  .plan-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .plan-name-row { display: flex; align-items: center; gap: 8px; }
  .plan-icon { width: 28px; height: 28px; border-radius: 7px; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center; color: #a5b4fc; }
  .plan-nm { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #e0e0f0; }
  .plan-pr { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: #f0f0f5; }
  .plan-feat { font-size: 10px; color: #6b6b85; margin-top: 2px; line-height: 1.6; }
  .popular-pill { position: absolute; top: -8px; right: 12px; background: #6366f1; color: #fff; font-size: 9px; padding: 2px 8px; border-radius: 100px; letter-spacing: 0.06em; text-transform: uppercase; }
  .privacy-note { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 10px; padding: 14px; text-align: center; font-size: 10px; color: #3a3a55; line-height: 1.7; margin-top: 4px; }
  .upgrade-link { background: none; border: none; color: #fbbf24; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; padding: 0; text-decoration: underline; margin-top: 4px; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) { .audit-layout { grid-template-columns: 1fr; } }
`;

export default function AuditPage() {
  const router = useRouter();
  const [contractCode, setContractCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);

  useEffect(() => { fetchLimits(); }, []);

  const fetchLimits = async () => {
    try {
      const res = await fetch("/api/user/limits");
      const data = await res.json();
      if (res.ok) setUserLimits(data);
    } catch (e) { console.error(e); }
    finally { setLoadingLimits(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractCode.trim()) { setError("Please enter your contract code"); return; }
    if (userLimits && !userLimits.canAudit) { setError(`You've reached your ${userLimits.plan} plan limit. Please upgrade.`); return; }
    setIsAuditing(true); setError(""); setProgress("Analyzing contract structure…");
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractCode, contractName: contractName || "Smart Contract", plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.limitReached) { setError(`Free plan limit reached (${data.currentUsage}/3). Please upgrade.`); setIsAuditing(false); setProgress(""); return; }
        throw new Error(data.error || "Audit failed");
      }
      setProgress("Audit complete — redirecting to results…");
      fetchLimits();
      setTimeout(() => router.push(`/dashboard/audit/results/${data.audit_id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit");
      setIsAuditing(false); setProgress("");
    }
  };

  const limitReached = userLimits?.plan === "FREE" && userLimits?.remaining === 0;
  const usagePct = userLimits?.limit ? Math.min(100, (userLimits.auditsThisMonth / userLimits.limit) * 100) : 0;

  return (
    <div className="audit-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="page-header">
        <div className="page-title">Smart Contract Audit</div>
        <div className="page-sub">Paste your Solidity code below for a comprehensive multi-agent security analysis</div>
      </div>

      {!loadingLimits && limitReached && (
        <div className="alert-box alert-warn" style={{ marginBottom: 24 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Audit limit reached</div>
            <div style={{ opacity: 0.8 }}>You've used all {userLimits?.auditsThisMonth}/3 free audits this month.</div>
            <button className="upgrade-link" onClick={() => router.push("/pricing")}>Upgrade plan →</button>
          </div>
        </div>
      )}

      {!loadingLimits && userLimits?.plan === "FREE" && (userLimits?.remaining ?? 0) > 0 && (
        <div className="alert-box alert-ok" style={{ marginBottom: 24 }}>
          <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <span>Free plan — {userLimits.auditsThisMonth}/3 audits used. {userLimits.remaining} remaining.</span>
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${usagePct}%` }} /></div>
          </div>
        </div>
      )}

      <div className="audit-layout">
        {/* Left — Form */}
        <div>
          <div className="card">
            <div className="card-title">Audit Configuration</div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Contract Name (optional)</label>
                <input placeholder="MySmartContract" value={contractName} onChange={e => setContractName(e.target.value)} />
              </div>
              <div className="field">
                <label>Solidity Code *</label>
                <textarea
                  value={contractCode}
                  onChange={e => setContractCode(e.target.value)}
                  placeholder={`pragma solidity ^0.8.0;\n\ncontract MyContract {\n    // Your Solidity code here\n}`}
                  required disabled={!!limitReached}
                />
              </div>

              {progress && (
                <div className="alert-box alert-info">
                  <div className="spinner" />
                  <span>{progress}</span>
                </div>
              )}

              {error && (
                <div className="alert-box alert-err">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={isAuditing || !contractCode.trim() || !!limitReached} className="btn-run">
                {isAuditing ? <><div className="spinner" /> Running Audit…</> : <><Play size={14} /> Run Security Audit</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right — Plans */}
        <div>
          <div className="plans-title">Select Plan</div>

          {PLANS.map(plan => {
            const Icon = plan.icon;
            const selected = selectedPlan === plan.id;
            return (
              <div key={plan.id} className={`plan-option ${selected ? "selected" : ""}`} onClick={() => setSelectedPlan(plan.id)}>
                {plan.popular && <div className="popular-pill">Popular</div>}
                <div className="plan-header">
                  <div className="plan-name-row">
                    <div className="plan-icon"><Icon size={14} /></div>
                    <div className="plan-nm">{plan.name}</div>
                  </div>
                  <div className="plan-pr">{plan.price}<span style={{ fontSize: 10, color: "#6b6b85", fontWeight: 400, fontFamily: "'DM Mono', monospace" }}>/mo</span></div>
                </div>
                <div className="plan-feat">{plan.features.join(" · ")}</div>
                {selected && <CheckCircle size={14} color="#6366f1" style={{ position: "absolute", top: 14, right: 12 }} />}
              </div>
            );
          })}

          <div className="privacy-note">
            Your code is encrypted and never stored permanently.<br />
            Free plan: 3 audits per month.
          </div>
        </div>
      </div>
    </div>
  );
}