"use client";
// app/dashboard/history/page.tsx (Responsive)

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle, Eye, Download, Plus, ChevronRight, Calendar, Clock, TrendingUp, FileText } from "lucide-react";

interface Audit {
  id: string; contract_name: string; chain: string; risk_level: string;
  risk_score: number; total_findings: number; critical_count: number;
  high_count: number; medium_count: number; low_count: number;
  plan_used: string; deployment_verdict: string; scan_duration_ms: number;
  pdf_available: boolean; created_at: string;
}

const riskColors = (level: string, score: number) => {
  if (level === "critical" || score >= 70) return { color: "#ef4444", border: "rgba(239,68,68,0.25)", bg: "rgba(239,68,68,0.08)" };
  if (level === "high"     || score >= 50) return { color: "#f97316", border: "rgba(249,115,22,0.25)", bg: "rgba(249,115,22,0.08)" };
  if (level === "medium"   || score >= 30) return { color: "#ca8a04", border: "rgba(234,179,8,0.25)",  bg: "rgba(234,179,8,0.08)" };
  return { color: "#10b981", border: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.08)" };
};

const verdictColors = (verdict: string) => {
  const v = verdict?.toLowerCase() ?? "";
  if (v.includes("safe"))    return { color: "#10b981", border: "rgba(16,185,129,0.2)",  bg: "rgba(16,185,129,0.07)" };
  if (v.includes("caution")) return { color: "#ca8a04", border: "rgba(234,179,8,0.2)",   bg: "rgba(234,179,8,0.07)" };
  if (v.includes("not"))     return { color: "#ef4444", border: "rgba(239,68,68,0.2)",   bg: "rgba(239,68,68,0.07)" };
  return { color: "var(--text-disabled)", border: "var(--border)", bg: "transparent" };
};

const relTime = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Today"; if (diff === 1) return "Yesterday";
  if (diff < 7)  return `${diff} days ago`; return new Date(d).toLocaleDateString();
};

export default function HistoryPage() {
  const router = useRouter();
  const [audits,  setAudits]  = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlId,    setDlId]    = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit/history?limit=50")
      .then(r => r.json())
      .then(d => setAudits(d.audits ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); setDlId(id);
    try {
      const res = await fetch(`/api/audit/report/${id}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = `Audit_Report_${name.replace(/[^a-z0-9]/gi, "_")}_${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert("Failed to download PDF."); }
    finally { setDlId(null); }
  };

  const Skeleton = () => (
    <div style={{ height: 76, borderRadius: "var(--radius-md)", background: "var(--elevated)", animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @media (max-width: 768px) {
          .summary-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .audit-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .audit-actions { align-self: flex-end !important; }
          .finding-chips { order: 3 !important; }
        }
        @media (max-width: 480px) {
          .summary-grid { grid-template-columns: 1fr !important; }
          .audit-info { width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(22px, 6vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 4 }}>Audit History</h1>
          <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>View and manage all your past smart contract security audits</p>
        </div>
        <Link href="/dashboard/scan"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          <Plus size={13} /> New Audit
        </Link>
      </div>

      {loading ? (
        <>
          <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} />)}
          </div>
        </>
      ) : (
        <>
          {/* Summary cards */}
          {audits.length > 0 && (
            <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              {[
                { label: "Total Audits",    value: audits.length, color: "var(--text-primary)" },
                { label: "Critical Issues", value: audits.reduce((s, a) => s + (a.critical_count || 0), 0), color: "#ef4444" },
                { label: "Avg Risk Score",  value: Math.round(audits.reduce((s, a) => s + (a.risk_score || 0), 0) / (audits.length || 1)), color: "var(--text-primary)" },
                { label: "PDF Reports",     value: audits.filter(a => a.pdf_available).length, color: "var(--text-primary)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(12px, 3vw, 18px)", textAlign: "center", boxShadow: "var(--shadow-card)" }}>
                  <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(22px, 5vw, 26px)", fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Satoshi', sans-serif" }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {audits.length === 0 ? (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "clamp(48px, 10vw, 72px) 24px", textAlign: "center", boxShadow: "var(--shadow-card)" }}>
              <div style={{ width: "clamp(48px, 10vw, 64px)", height: "clamp(48px, 10vw, 64px)", borderRadius: "var(--radius-lg)", background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FileText size="clamp(22px, 5vw, 28px)" style={{ color: "var(--brand)" }} />
              </div>
              <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 8 }}>No audits yet</h3>
              <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.7, fontFamily: "'Satoshi', sans-serif" }}>Run your first smart contract audit to see results here.</p>
              <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "var(--brand)", color: "#fff", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, textDecoration: "none" }}>
                <Plus size={13} /> Start Your First Audit
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {audits.map(audit => {
                const rs = riskColors(audit.risk_level, audit.risk_score);
                const vc = verdictColors(audit.deployment_verdict);
                return (
                  <div key={audit.id}
                    onClick={() => router.push(`/dashboard/audit/results/${audit.id}`)}
                    className="audit-row"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-card)", transition: "box-shadow 0.15s, border-color 0.15s", flexWrap: "wrap" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; }}
                  >
                    {/* Score ring */}
                    <div style={{ width: "clamp(40px, 8vw, 48px)", height: "clamp(40px, 8vw, 48px)", borderRadius: "50%", border: `2px solid ${rs.border}`, background: rs.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 800, color: rs.color }}>{audit.risk_score}</span>
                    </div>

                    {/* Info */}
                    <div className="audit-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(13px, 3.5vw, 14px)", fontWeight: 700, color: "var(--text-primary)" }}>{audit.contract_name}</span>
                        <span style={{ fontSize: "clamp(9px, 2vw, 10px)", padding: "2px 7px", borderRadius: 4, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-disabled)", fontFamily: "'Satoshi', monospace" }}>{audit.chain}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 14px)", flexWrap: "wrap", fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={10} />{relTime(audit.created_at)}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{Math.round(audit.scan_duration_ms / 1000)}s</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={10} />{audit.plan_used}</span>
                      </div>
                    </div>

                    {/* Finding chips */}
                    <div className="finding-chips" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {audit.critical_count > 0 && <span style={{ fontSize: "clamp(9px, 2vw, 10px)", padding: "3px 8px", borderRadius: 5, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>{audit.critical_count}C</span>}
                      {audit.high_count     > 0 && <span style={{ fontSize: "clamp(9px, 2vw, 10px)", padding: "3px 8px", borderRadius: 5, background: "rgba(249,115,22,0.1)", color: "#f97316", fontFamily: "'Satoshi', sans-serif" }}>{audit.high_count}H</span>}
                      {audit.medium_count   > 0 && <span style={{ fontSize: "clamp(9px, 2vw, 10px)", padding: "3px 8px", borderRadius: 5, background: "rgba(234,179,8,0.1)",  color: "#ca8a04", fontFamily: "'Satoshi', sans-serif" }}>{audit.medium_count}M</span>}
                      <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>{audit.total_findings} total</span>
                    </div>

                    {/* Verdict */}
                    {audit.deployment_verdict && (
                      <span style={{ fontSize: "clamp(9px, 2vw, 10px)", padding: "3px 10px", borderRadius: 5, background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`, fontFamily: "'Satoshi', sans-serif", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
                        {audit.deployment_verdict}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="audit-actions" style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {audit.pdf_available && (
                        <button onClick={e => downloadPdf(audit.id, audit.contract_name, e)}
                          style={{ width: "clamp(28px, 6vw, 32px)", height: "clamp(28px, 6vw, 32px)", borderRadius: "var(--radius-sm)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s, color 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--elevated)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                        >
                          {dlId === audit.id
                            ? <span style={{ width: 13, height: 13, border: "2px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "pulse 0.7s linear infinite", display: "inline-block" }} />
                            : <Download size={13} />}
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/audit/results/${audit.id}`); }}
                        style={{ width: "clamp(28px, 6vw, 32px)", height: "clamp(28px, 6vw, 32px)", borderRadius: "var(--radius-sm)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s, color 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--elevated)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                      >
                        <Eye size={13} />
                      </button>
                      <ChevronRight size={14} style={{ color: "var(--text-disabled)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}