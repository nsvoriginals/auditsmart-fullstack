"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  AlertTriangle, Shield, Brain, CheckCircle, XCircle,
  AlertCircle, ChevronDown, ChevronUp, Download, ArrowLeft,
  Loader2, FileText, Share2, Zap, Award, BarChart3
} from "lucide-react";

interface Finding { id: string; title: string; severity: string; description: string; recommendation: string; lineNumber: string | null; }
interface AuditData {
  id: string; contractName: string; status: string; score: number; summary: string;
  report: { risk_level: string; risk_score: number; total_findings: number; critical_count: number; high_count: number; medium_count: number; low_count: number; info_count: number; agents_used: string[]; scan_duration_ms: number; deployment_verdict?: string; thinking_chain?: string; findings?: Finding[]; plan_used?: string; has_fix_suggestions?: boolean; };
  createdAt: string; findings: Finding[];
}

// ⭐ CSS with CSS Variables for theme support
const getCSS = (isLight: boolean) => `
  .results-root { 
    font-family: 'Satoshi', sans-serif; 
    color: var(--text-primary); 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 0 clamp(16px, 4vw, 24px); 
  }
  .top-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: clamp(24px, 5vw, 36px); }
  .btn-back { 
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; 
    background: var(--card); border: 1px solid var(--border); border-radius: 8px; 
    color: var(--text-muted); font-family: 'Satoshi', sans-serif; 
    font-size: clamp(11px, 2.5vw, 12px); cursor: pointer; text-decoration: none; transition: all 0.15s; 
  }
  .btn-back:hover { color: var(--text-primary); border-color: var(--border-hover); }
  .btn-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-action { 
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 8px; 
    font-family: 'Satoshi', sans-serif; font-size: clamp(11px, 2.5vw, 12px); cursor: pointer; transition: all 0.15s; 
  }
  .btn-action-ghost { background: var(--card); border: 1px solid var(--border); color: var(--text-muted); }
  .btn-action-ghost:hover { border-color: var(--border-hover); color: var(--text-primary); }
  .btn-action-primary { background: var(--brand); border: none; color: #fff; }
  .btn-action-primary:hover { opacity: 0.9; }
  .btn-action-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .contract-title-area { text-align: center; margin-bottom: clamp(24px, 5vw, 36px); }
  .audit-label { 
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; 
    background: ${isLight ? "rgba(79,70,229,0.08)" : "rgba(99,102,241,0.08)"}; 
    border: 1px solid ${isLight ? "rgba(79,70,229,0.2)" : "rgba(99,102,241,0.2)"}; 
    color: var(--brand-light); font-size: clamp(9px, 2vw, 10px); text-transform: uppercase; 
    letter-spacing: 0.08em; margin-bottom: 12px; font-family: 'Satoshi', sans-serif; 
  }
  .contract-name { 
    font-family: 'Satoshi', sans-serif; font-size: clamp(24px, 6vw, 36px); font-weight: 800; 
    color: var(--text-primary); letter-spacing: -0.025em; margin-bottom: 8px; word-break: break-word; 
  }
  .contract-meta { 
    font-size: clamp(10px, 2.5vw, 11px); color: var(--text-disabled); 
    font-family: 'Satoshi', sans-serif; flex-wrap: wrap; gap: 8px; 
  }
  
  .score-card { 
    background: var(--card); border: 1px solid var(--border); border-radius: 14px; 
    padding: clamp(20px, 5vw, 32px); display: flex; align-items: center; 
    gap: clamp(20px, 5vw, 40px); flex-wrap: wrap; margin-bottom: 16px; justify-content: center; 
    box-shadow: var(--shadow-card);
  }
  .gauge-wrap { position: relative; width: clamp(100px, 20vw, 120px); height: clamp(100px, 20vw, 120px); flex-shrink: 0; }
  .gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gauge-score { 
    font-family: 'Satoshi', sans-serif; font-size: clamp(28px, 6vw, 32px); font-weight: 800; 
    color: var(--text-primary); line-height: 1; 
  }
  .gauge-label { font-size: clamp(8px, 2vw, 9px); color: var(--text-muted); margin-top: 2px; font-family: 'Satoshi', sans-serif; }
  .risk-chip { 
    display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: clamp(9px, 2vw, 10px); 
    text-transform: uppercase; letter-spacing: 0.08em; margin-top: 8px; 
    font-family: 'Satoshi', sans-serif; white-space: nowrap; 
  }
  
  .counts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: clamp(16px, 4vw, 24px); flex: 1; width: 100%; }
  .count-item { text-align: center; }
  .count-num { font-family: 'Satoshi', sans-serif; font-size: clamp(24px, 5vw, 28px); font-weight: 800; line-height: 1; }
  .count-lbl { 
    font-size: clamp(9px, 2vw, 10px); color: var(--text-muted); margin-top: 4px; 
    text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Satoshi', sans-serif; 
  }
  
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .stat-card { 
    background: var(--card); border: 1px solid var(--border); border-radius: 10px; 
    padding: clamp(12px, 3vw, 16px); text-align: center; 
  }
  .stat-val { 
    font-family: 'Satoshi', sans-serif; font-size: clamp(16px, 4vw, 18px); font-weight: 700; 
    color: var(--text-primary); word-break: break-word; 
  }
  .stat-lbl { font-size: clamp(9px, 2vw, 10px); color: var(--text-muted); margin-top: 4px; font-family: 'Satoshi', sans-serif; }
  
  .section-card { 
    background: var(--card); border: 1px solid var(--border); border-radius: 14px; 
    margin-bottom: 16px; overflow: hidden; box-shadow: var(--shadow-card);
  }
  .section-head { 
    padding: clamp(14px, 4vw, 18px) clamp(16px, 4vw, 24px); border-bottom: 1px solid var(--border); 
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap; cursor: pointer; 
  }
  .section-title { 
    font-family: 'Satoshi', sans-serif; font-size: clamp(13px, 3.5vw, 14px); font-weight: 700; 
    color: var(--text-primary); 
  }
  .section-body { padding: clamp(16px, 4vw, 24px); }
  .summary-text { 
    font-size: clamp(12px, 3vw, 13px); line-height: 1.9; color: var(--text-secondary); 
    font-family: 'Satoshi', sans-serif; 
  }
  .verdict-box { 
    margin-top: 16px; padding: 12px 16px; border-radius: 8px; 
    font-size: clamp(11px, 2.5vw, 12px); font-family: 'Satoshi', sans-serif; 
  }
  
  .thinking-body { padding: clamp(16px, 4vw, 20px) clamp(16px, 4vw, 24px); }
  .thinking-pre { 
    background: var(--elevated); border: 1px solid var(--border); border-radius: 8px; 
    padding: clamp(12px, 3vw, 16px); font-size: clamp(10px, 2.5vw, 11px); line-height: 1.8; 
    color: var(--text-muted); white-space: pre-wrap; overflow-x: auto; 
    font-family: 'Satoshi', monospace; max-height: 400px; overflow-y: auto; 
  }
  
  .findings-list { }
  .finding-row { border-bottom: 1px solid var(--border); }
  .finding-row:last-child { border-bottom: none; }
  .finding-trigger { 
    width: 100%; padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px); 
    display: flex; align-items: center; justify-content: space-between; gap: 12px; 
    background: none; border: none; color: var(--text-primary); 
    font-family: 'Satoshi', sans-serif; font-size: clamp(11px, 2.5vw, 12px); 
    cursor: pointer; text-align: left; transition: background 0.1s; 
  }
  .finding-trigger:hover { background: var(--elevated); }
  .finding-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
  .sev-badge { 
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 6px; 
    font-size: clamp(9px, 2vw, 10px); text-transform: uppercase; letter-spacing: 0.06em; 
    border: 1px solid; font-family: 'Satoshi', sans-serif; white-space: nowrap; 
  }
  .line-chip { 
    font-size: clamp(9px, 2vw, 10px); padding: 2px 8px; border-radius: 4px; 
    background: var(--elevated); border: 1px solid var(--border); color: var(--text-muted); 
    font-family: 'Satoshi', monospace; white-space: nowrap; 
  }
  .finding-title { 
    font-size: clamp(12px, 3vw, 13px); color: var(--text-primary); 
    font-family: 'Satoshi', sans-serif; word-break: break-word; 
  }
  .finding-detail { 
    padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px); 
    background: var(--elevated); border-top: 1px solid var(--border); 
  }
  .detail-label { 
    font-size: clamp(9px, 2vw, 10px); color: var(--text-muted); text-transform: uppercase; 
    letter-spacing: 0.08em; margin-bottom: 8px; font-family: 'Satoshi', sans-serif; 
  }
  .detail-text { 
    font-size: clamp(11px, 2.5vw, 12px); color: var(--text-secondary); line-height: 1.8; 
    font-family: 'Satoshi', sans-serif; 
  }
  .reco-box { 
    padding: 12px 16px; background: ${isLight ? "rgba(16,185,129,0.04)" : "rgba(52,211,153,0.04)"}; 
    border: 1px solid ${isLight ? "rgba(16,185,129,0.15)" : "rgba(52,211,153,0.1)"}; 
    border-radius: 8px; 
  }
  .empty-state { text-align: center; padding: clamp(40px, 10vw, 60px) clamp(16px, 4vw, 24px); }
  .empty-state svg { width: clamp(32px, 8vw, 40px); height: clamp(32px, 8vw, 40px); margin-bottom: 16px; }
  .empty-state div:first-of-type { 
    font-size: clamp(14px, 4vw, 16px); margin-bottom: 8px; 
    color: var(--text-primary); font-family: 'Satoshi', sans-serif; font-weight: 700;
  }
  .empty-state div:last-of-type { 
    font-size: clamp(11px, 2.5vw, 12px); color: var(--text-muted); 
    font-family: 'Satoshi', sans-serif;
  }
  
  .loading-state { 
    display: flex; flex-direction: column; align-items: center; justify-content: center; 
    min-height: 400px; gap: 12px; text-align: center; padding: 20px; 
  }
  .spinner { 
    width: clamp(28px, 6vw, 32px); height: clamp(28px, 6vw, 32px); 
    border: 3px solid var(--border); border-top-color: var(--brand); 
    border-radius: 50%; animation: spin 0.7s linear infinite; 
  }
  .spin-sm { 
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); 
    border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; 
    display: inline-block; 
  }
  .error-container { 
    max-width: 500px; margin: 80px auto; padding: clamp(20px, 5vw, 32px); 
    background: var(--card); border: 1px solid rgba(239,68,68,0.2); border-radius: 14px; 
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  
  @media (max-width: 640px) { 
    .finding-left { width: 100%; justify-content: space-between; }
    .finding-trigger { flex-wrap: wrap; }
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .counts-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .stats-row { grid-template-columns: 1fr; }
    .counts-grid { grid-template-columns: 1fr; gap: 12px; }
    .btn-actions { width: 100%; justify-content: stretch; }
    .btn-action { flex: 1; justify-content: center; }
    .btn-back { flex: 1; justify-content: center; }
    .top-bar { flex-direction: column; }
    .top-bar .btn-back { width: 100%; }
    .btn-actions { width: 100%; }
  }
`;

const SEVER = {
  critical: { color: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
  high:     { color: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
  medium:   { color: "rgba(234,179,8,0.12)", text: "#ca8a04", border: "rgba(234,179,8,0.3)" },
  low:      { color: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  info:     { color: "rgba(100,116,139,0.12)", text: "#64748b", border: "rgba(100,116,139,0.3)" },
};

const RISK = {
  critical: { gauge: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
  high:     { gauge: "#f97316", text: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)" },
  medium:   { gauge: "#eab308", text: "#ca8a04", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)" },
  low:      { gauge: "#10b981", text: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
  unknown:  { gauge: "#6366f1", text: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)" },
};

export default function AuditResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const auditId = params.id as string;
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit/results/${auditId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAudit(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load audit"); }
    finally { setLoading(false); }
  }, [auditId]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/audit/report/${auditId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `Audit_Report_${audit?.contractName?.replace(/[^a-z0-9]/gi, "_") || "contract"}_${auditId.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "Failed to download PDF"); }
    finally { setPdfLoading(false); }
  };

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const toggle = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  if (!mounted) return null;

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getCSS(isLight) }} />
      <div className="loading-state">
        <div className="spinner" />
        <span style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>Loading audit results…</span>
      </div>
    </>
  );

  if (error || !audit) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getCSS(isLight) }} />
      <div className="error-container">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <XCircle size={18} color="#ef4444" />
          <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: "clamp(14px, 4vw, 16px)", color: "#ef4444" }}>Error loading audit</span>
        </div>
        <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-muted)", marginBottom: 20, fontFamily: "'Satoshi', sans-serif" }}>{error || "Audit not found"}</p>
        <button onClick={() => router.push("/dashboard/audit")} style={{ padding: "10px 20px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "clamp(11px, 2.5vw, 12px)", fontFamily: "'Satoshi', sans-serif", width: "100%", maxWidth: 200 }}>
          Start New Audit
        </button>
      </div>
    </>
  );

  const report = audit.report;
  const findings = audit.findings || report?.findings || [];
  const riskKey = (report?.risk_level?.toLowerCase() as keyof typeof RISK) || "unknown";
  const riskStyle = RISK[riskKey] || RISK.unknown;
  const riskScore = report?.risk_score || audit.score || 0;
  const circumference = 2 * Math.PI * 52;
  const dash = (riskScore / 100) * circumference;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getCSS(isLight) }} />
      <div className="results-root">

        {/* Top bar */}
        <div className="top-bar">
          <button className="btn-back" onClick={() => router.push("/dashboard/audit")}>
            <ArrowLeft size={12} /> New Audit
          </button>
          <div className="btn-actions">
            <button className="btn-action btn-action-ghost" onClick={share}>
              <Share2 size={12} /> {copied ? "Copied!" : "Share"}
            </button>
            <button className="btn-action btn-action-primary" onClick={downloadPDF} disabled={pdfLoading}>
              {pdfLoading ? <><div className="spin-sm" /> Generating…</> : <><Download size={12} /> Export PDF</>}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="contract-title-area">
          <div className="audit-label"><FileText size={10} /> Audit Report</div>
          <div className="contract-name">{audit.contractName}</div>
          <div className="contract-meta">
            Completed {new Date(audit.createdAt).toLocaleDateString()} &nbsp;·&nbsp;
            <span style={{ fontFamily: "'Satoshi', monospace" }}>{report?.scan_duration_ms ? Math.round(report.scan_duration_ms / 1000) : 0}s scan</span>
          </div>
        </div>

        {/* Score card */}
        <div className="score-card">
          <div>
            <div className="gauge-wrap">
              <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={riskStyle.gauge} strokeWidth="10"
                  strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
              </svg>
              <div className="gauge-center">
                <div className="gauge-score">{riskScore}</div>
                <div className="gauge-label">/100</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span className="risk-chip" style={{ background: riskStyle.bg, color: riskStyle.text, border: `1px solid ${riskStyle.border}` }}>
                {report?.risk_level?.toUpperCase() || "UNKNOWN"} RISK
              </span>
            </div>
          </div>

          <div className="counts-grid">
            <div className="count-item"><div className="count-num" style={{ color: "#ef4444" }}>{report?.critical_count || 0}</div><div className="count-lbl">Critical</div></div>
            <div className="count-item"><div className="count-num" style={{ color: "#f97316" }}>{report?.high_count || 0}</div><div className="count-lbl">High</div></div>
            <div className="count-item"><div className="count-num" style={{ color: "#ca8a04" }}>{report?.medium_count || 0}</div><div className="count-lbl">Medium</div></div>
            <div className="count-item"><div className="count-num" style={{ color: "#3b82f6" }}>{report?.low_count || 0}</div><div className="count-lbl">Low</div></div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { icon: <AlertTriangle size={13} />, val: report?.total_findings || findings.length, lbl: "Total Findings" },
            { icon: <Brain size={13} />, val: report?.agents_used?.length || 0, lbl: "AI Agents" },
            { icon: <Zap size={13} />, val: report?.plan_used || "Free", lbl: "Plan Used" },
            { icon: <Award size={13} />, val: report?.has_fix_suggestions ? "Yes" : "No", lbl: "Fix Suggestions" },
          ].map(s => (
            <div key={s.lbl} className="stat-card">
              <div style={{ color: "var(--brand-light)", marginBottom: 6 }}>{s.icon}</div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Executive Summary */}
        <div className="section-card">
          <div className="section-head" style={{ cursor: "default" }}>
            <BarChart3 size={14} color="var(--brand-light)" />
            <span className="section-title">Executive Summary</span>
          </div>
          <div className="section-body">
            <p className="summary-text">{audit.summary}</p>
            {report?.deployment_verdict && (
              <div className="verdict-box" style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}` }}>
                <span style={{ color: riskStyle.text, fontWeight: 500, fontSize: "clamp(10px, 2.5vw, 11px)" }}>Deployment Verdict: </span>
                <span style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text-secondary)" }}>{report.deployment_verdict}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Thinking */}
        {report?.thinking_chain && (
          <div className="section-card">
            <div className="section-head" onClick={() => setShowThinking(!showThinking)}>
              <Brain size={14} color="var(--brand-light)" />
              <span className="section-title">AI Extended Thinking</span>
              <div style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{showThinking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
            </div>
            {showThinking && (
              <div className="thinking-body">
                <pre className="thinking-pre">{report.thinking_chain}</pre>
              </div>
            )}
          </div>
        )}

        {/* Findings */}
        <div className="section-card">
          <div className="section-head" style={{ cursor: "default" }}>
            <AlertTriangle size={14} color="var(--brand-light)" />
            <span className="section-title">Security Findings ({findings.length})</span>
          </div>

          {findings.length === 0 ? (
            <div className="empty-state">
              <Shield size={40} color="#10b981" />
              <div>No Vulnerabilities Found</div>
              <div>Your contract looks secure. Great work!</div>
            </div>
          ) : (
            <div className="findings-list">
              {findings.map((f, i) => {
                const key = f.id || String(i);
                const sev = f.severity.toLowerCase() as keyof typeof SEVER;
                const s = SEVER[sev] || SEVER.info;
                const isOpen = expanded.has(key);

                return (
                  <div key={key} className="finding-row">
                    <button className="finding-trigger" onClick={() => toggle(key)}>
                      <div className="finding-left">
                        <span className="sev-badge" style={{ background: s.color, color: s.text, borderColor: s.border }}>
                          {f.severity.toUpperCase()}
                        </span>
                        <span className="finding-title">{f.title}</span>
                        {f.lineNumber && <span className="line-chip">Line {f.lineNumber}</span>}
                      </div>
                      {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                    </button>

                    {isOpen && (
                      <div className="finding-detail">
                        <div style={{ marginBottom: 16 }}>
                          <div className="detail-label">Description</div>
                          <p className="detail-text">{f.description}</p>
                        </div>
                        <div>
                          <div className="detail-label">Recommendation</div>
                          <div className="reco-box">
                            <p className="detail-text">{f.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}