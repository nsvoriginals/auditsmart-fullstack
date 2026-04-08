"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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

const css = `
  .results-root { font-family: 'Satoshi', sans-serif; color: #f0f0f5; }
  .top-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 36px; }
  .btn-back { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 8px; color: #6b6b85; font-family: 'Satoshi', sans-serif; font-size: 12px; cursor: pointer; text-decoration: none; transition: all 0.15s; }
  .btn-back:hover { color: #f0f0f5; border-color: #2e2e45; }
  .btn-actions { display: flex; gap: 10px; }
  .btn-action { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 8px; font-family: 'Satoshi', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
  .btn-action-ghost { background: #0e0e18; border: 1px solid #1e1e2e; color: #6b6b85; }
  .btn-action-ghost:hover { border-color: #2e2e45; color: #f0f0f5; }
  .btn-action-primary { background: #6366f1; border: none; color: #fff; }
  .btn-action-primary:hover { background: #5254cc; }
  .btn-action-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .contract-title-area { text-align: center; margin-bottom: 36px; }
  .audit-label { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); color: #a5b4fc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; font-family: 'Satoshi', sans-serif; }
  .contract-name { font-family: 'Satoshi', sans-serif; font-size: clamp(24px,4vw,36px); font-weight: 800; color: #f0f0f5; letter-spacing: -0.025em; margin-bottom: 8px; }
  .contract-meta { font-size: 11px; color: #3a3a55; font-family: 'Satoshi', sans-serif; }
  .score-card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 14px; padding: 32px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; margin-bottom: 16px; }
  .gauge-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
  .gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gauge-score { font-family: 'Satoshi', sans-serif; font-size: 32px; font-weight: 800; color: #f0f0f5; line-height: 1; }
  .gauge-label { font-size: 9px; color: #6b6b85; margin-top: 2px; font-family: 'Satoshi', sans-serif; }
  .risk-chip { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 8px; font-family: 'Satoshi', sans-serif; }
  .counts-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; flex: 1; }
  .count-item { text-align: center; }
  .count-num { font-family: 'Satoshi', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; }
  .count-lbl { font-size: 10px; color: #6b6b85; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Satoshi', sans-serif; }
  .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
  .stat-card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 10px; padding: 16px; text-align: center; }
  .stat-val { font-family: 'Satoshi', sans-serif; font-size: 18px; font-weight: 700; color: #f0f0f5; }
  .stat-lbl { font-size: 10px; color: #6b6b85; margin-top: 4px; font-family: 'Satoshi', sans-serif; }
  .section-card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 14px; margin-bottom: 16px; overflow: hidden; }
  .section-head { padding: 18px 24px; border-bottom: 1px solid #1e1e2e; display: flex; align-items: center; gap: 10px; }
  .section-title { font-family: 'Satoshi', sans-serif; font-size: 14px; font-weight: 700; color: #e0e0f0; }
  .section-body { padding: 24px; }
  .summary-text { font-size: 13px; line-height: 1.9; color: #a0a0b8; font-family: 'Satoshi', sans-serif; }
  .verdict-box { margin-top: 16px; padding: 12px 16px; border-radius: 8px; font-size: 12px; font-family: 'Satoshi', sans-serif; }
  .thinking-body { padding: 20px 24px; }
  .thinking-pre { background: #111118; border: 1px solid #1e1e2e; border-radius: 8px; padding: 16px; font-size: 11px; line-height: 1.8; color: #6b6b85; white-space: pre-wrap; overflow-x: auto; font-family: 'Satoshi', monospace; }
  .findings-list { }
  .finding-row { border-bottom: 1px solid #1e1e2e; }
  .finding-row:last-child { border-bottom: none; }
  .finding-trigger { width: 100%; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: none; border: none; color: #f0f0f5; font-family: 'Satoshi', sans-serif; font-size: 12px; cursor: pointer; text-align: left; transition: background 0.1s; }
  .finding-trigger:hover { background: rgba(255,255,255,0.02); }
  .finding-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .sev-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid; font-family: 'Satoshi', sans-serif; }
  .line-chip { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #111118; border: 1px solid #1e1e2e; color: #6b6b85; font-family: 'Satoshi', monospace; }
  .finding-title { font-size: 13px; color: #e0e0f0; font-family: 'Satoshi', sans-serif; }
  .finding-detail { padding: 16px 24px 24px; background: #080810; border-top: 1px solid #1e1e2e; }
  .detail-label { font-size: 10px; color: #6b6b85; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-family: 'Satoshi', sans-serif; }
  .detail-text { font-size: 12px; color: #a0a0b8; line-height: 1.8; font-family: 'Satoshi', sans-serif; }
  .reco-box { padding: 12px 16px; background: rgba(52,211,153,0.04); border: 1px solid rgba(52,211,153,0.1); border-radius: 8px; }
  .empty-state { text-align: center; padding: 60px 24px; }
  .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 12px; }
  .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
  .spin-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 600px) { .counts-grid { grid-template-columns: repeat(2,1fr); } .stats-row { grid-template-columns: repeat(2,1fr); } }
`;

const SEVER = {
  critical: { color: "rgba(239,68,68,0.12)", text: "#fca5a5", border: "rgba(239,68,68,0.2)" },
  high:     { color: "rgba(249,115,22,0.12)", text: "#fdba74", border: "rgba(249,115,22,0.2)" },
  medium:   { color: "rgba(234,179,8,0.12)",  text: "#fde047", border: "rgba(234,179,8,0.2)" },
  low:      { color: "rgba(59,130,246,0.12)", text: "#93c5fd", border: "rgba(59,130,246,0.2)" },
  info:     { color: "rgba(100,116,139,0.12)",text: "#94a3b8", border: "rgba(100,116,139,0.2)" },
};

const RISK = {
  critical: { gauge: "#ef4444", text: "#fca5a5", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  high:     { gauge: "#f97316", text: "#fdba74", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
  medium:   { gauge: "#eab308", text: "#fde047", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
  low:      { gauge: "#10b981", text: "#6ee7b7", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  unknown:  { gauge: "#6366f1", text: "#a5b4fc", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
};

export default function AuditResultsPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

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

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="loading-state"><div className="spinner" /><span style={{ fontSize: 12, color: "#6b6b85", fontFamily: "'Satoshi', sans-serif" }}>Loading audit results…</span></div>
    </>
  );

  if (error || !audit) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ maxWidth: 500, margin: "80px auto", padding: 32, background: "#0e0e18", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <XCircle size={18} color="#ef4444" />
          <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: 16, color: "#fca5a5" }}>Error loading audit</span>
        </div>
        <p style={{ fontSize: 12, color: "#6b6b85", marginBottom: 20, fontFamily: "'Satoshi', sans-serif" }}>{error || "Audit not found"}</p>
        <button onClick={() => router.push("/dashboard/audit")} style={{ padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'Satoshi', sans-serif" }}>
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
      <style dangerouslySetInnerHTML={{ __html: css }} />
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
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1e1e2e" strokeWidth="10" />
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
            <div className="count-item"><div className="count-num" style={{ color: "#fca5a5" }}>{report?.critical_count || 0}</div><div className="count-lbl">Critical</div></div>
            <div className="count-item"><div className="count-num" style={{ color: "#fdba74" }}>{report?.high_count || 0}</div><div className="count-lbl">High</div></div>
            <div className="count-item"><div className="count-num" style={{ color: "#fde047" }}>{report?.medium_count || 0}</div><div className="count-lbl">Medium</div></div>
            <div className="count-item"><div className="count-num" style={{ color: "#93c5fd" }}>{report?.low_count || 0}</div><div className="count-lbl">Low</div></div>
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
              <div style={{ color: "#a5b4fc", marginBottom: 6 }}>{s.icon}</div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Executive Summary */}
        <div className="section-card">
          <div className="section-head">
            <BarChart3 size={14} color="#a5b4fc" />
            <span className="section-title">Executive Summary</span>
          </div>
          <div className="section-body">
            <p className="summary-text">{audit.summary}</p>
            {report?.deployment_verdict && (
              <div className="verdict-box" style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}` }}>
                <span style={{ color: riskStyle.text, fontWeight: 500, fontSize: 11 }}>Deployment Verdict: </span>
                <span style={{ fontSize: 12, color: "#a0a0b8" }}>{report.deployment_verdict}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Thinking */}
        {report?.thinking_chain && (
          <div className="section-card">
            <div className="section-head" style={{ cursor: "pointer" }} onClick={() => setShowThinking(!showThinking)}>
              <Brain size={14} color="#a5b4fc" />
              <span className="section-title">AI Extended Thinking</span>
              <div style={{ marginLeft: "auto", color: "#6b6b85" }}>{showThinking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
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
          <div className="section-head">
            <AlertTriangle size={14} color="#a5b4fc" />
            <span className="section-title">Security Findings ({findings.length})</span>
          </div>

          {findings.length === 0 ? (
            <div className="empty-state">
              <Shield size={40} color="#6ee7b7" style={{ marginBottom: 16 }} />
              <div style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: 16, color: "#f0f0f5", marginBottom: 8 }}>No Vulnerabilities Found</div>
              <div style={{ fontSize: 12, color: "#6b6b85", fontFamily: "'Satoshi', sans-serif" }}>Your contract looks secure. Great work!</div>
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
                      {isOpen ? <ChevronUp size={14} color="#6b6b85" /> : <ChevronDown size={14} color="#6b6b85" />}
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