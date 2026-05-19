"use client";
// app/dashboard/history/page.tsx - Fixed with Light Theme

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Eye, Download, Plus, ChevronRight,
  Calendar, Clock, TrendingUp, FileText, Loader2
} from "lucide-react";
import { ChainIcon, chainColor, chainLabel } from "@/components/ChainIcon";

interface Audit {
  id: string; 
  contract_name: string; 
  chain: string; 
  risk_level: string;
  risk_score: number; 
  total_findings: number; 
  critical_count: number;
  high_count: number; 
  medium_count: number; 
  low_count: number;
  plan_used: string; 
  deployment_verdict: string; 
  scan_duration_ms: number;
  pdf_available: boolean; 
  created_at: string;
}

// Risk colors with light theme support
const riskColors = (level: string, score: number, isLight: boolean) => {
  if (level === "critical" || score >= 70) return { 
    color: "#ef4444", 
    border: "rgba(239,68,68,0.25)", 
    bg: isLight ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.08)" 
  };
  if (level === "high" || score >= 50) return { 
    color: "#f97316", 
    border: "rgba(249,115,22,0.25)", 
    bg: isLight ? "rgba(249,115,22,0.06)" : "rgba(249,115,22,0.08)" 
  };
  if (level === "medium" || score >= 30) return { 
    color: "#ca8a04", 
    border: "rgba(234,179,8,0.25)", 
    bg: isLight ? "rgba(234,179,8,0.06)" : "rgba(234,179,8,0.08)" 
  };
  return { 
    color: "#10b981", 
    border: "rgba(16,185,129,0.25)", 
    bg: isLight ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.08)" 
  };
};

const verdictColors = (verdict: string, isLight: boolean) => {
  const v = verdict?.toLowerCase() ?? "";
  if (v.includes("safe")) return { 
    color: "#10b981", 
    border: "rgba(16,185,129,0.2)", 
    bg: isLight ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.07)" 
  };
  if (v.includes("caution")) return { 
    color: "#ca8a04", 
    border: "rgba(234,179,8,0.2)", 
    bg: isLight ? "rgba(234,179,8,0.06)" : "rgba(234,179,8,0.07)" 
  };
  if (v.includes("not") || v.includes("deploy")) return { 
    color: "#ef4444", 
    border: "rgba(239,68,68,0.2)", 
    bg: isLight ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.07)" 
  };
  return { color: "var(--text-disabled)", border: "var(--border)", bg: "transparent" };
};

const relTime = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Today"; 
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`; // ✅ FIXED: Properly closed template string
  return new Date(d).toLocaleDateString();
};

export default function HistoryPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlId, setDlId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit/history?limit=50")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        // Transform API response to match expected format
        const transformed = (d.audits || []).map((a: any) => ({
          id: a.id,
          contract_name: a.contract_name || a.contractName || "Unnamed",
          chain: a.chain || "ethereum",
          risk_level: a.risk_level || "low",
          risk_score: a.risk_score || a.score || 0,
          total_findings: a.total_findings || 0,
          critical_count: a.critical_count || 0,
          high_count: a.high_count || 0,
          medium_count: a.medium_count || 0,
          low_count: a.low_count || 0,
          plan_used: a.plan_used || "free",
          deployment_verdict: a.deployment_verdict || "",
          scan_duration_ms: a.scan_duration_ms || 0,
          pdf_available: a.pdf_available !== false,
          created_at: a.created_at || a.createdAt || new Date().toISOString(),
        }));
        setAudits(transformed);
      })
      .catch(err => {
        console.error("Failed to fetch history:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setDlId(id);
    try {
      const res = await fetch(`/api/audit/report/${id}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; 
      a.download = `Audit_Report_${name.replace(/[^a-z0-9]/gi, "_")}_${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a); 
      URL.revokeObjectURL(url);
    } catch { 
      alert("Failed to download PDF."); 
    } finally { 
      setDlId(null); 
    }
  };

  const Skeleton = () => (
    <div style={{ 
      height: 76, 
      borderRadius: "var(--radius-md)", 
      background: "var(--elevated)", 
      animation: "pulse 1.5s ease-in-out infinite" 
    }} />
  );

  // Error state
  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: 400,
        gap: 16 
      }}>
        <div style={{ color: "#ef4444" }}>⚠️ Failed to load history</div>
        <p style={{ color: "var(--text-muted)" }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: "8px 16px", 
            background: "var(--brand)", 
            color: "#fff", 
            border: "none", 
            borderRadius: "var(--radius)", 
            cursor: "pointer" 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

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
          <h1 style={{
            fontFamily: "'Satoshi', sans-serif",
            fontSize: "clamp(24px, 6vw, 30px)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
            marginBottom: 6
          }}>
            Audit History
          </h1>
          <p style={{
            fontSize: "clamp(13px, 3vw, 14px)",
            color: "var(--text-muted)",
            fontFamily: "'Satoshi', sans-serif",
            fontWeight: 500,
          }}>
            View and manage all your past smart contract security audits
          </p>
        </div>
        <Link href="/dashboard/scan"
          prefetch={true}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            fontFamily: "'Satoshi', sans-serif",
            fontSize: "clamp(13px, 3vw, 14px)",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap"
          }}>
          <Plus size={15} /> New Audit
        </Link>
      </div>

      {loading ? (
        <>
          <div className="summary-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: 12 
          }}>
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
            <div className="summary-grid" style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              gap: 12 
            }}>
              {[
                { label: "Total Audits", value: audits.length, color: "var(--text-primary)" },
                { label: "Critical Issues", value: audits.reduce((s, a) => s + (a.critical_count || 0), 0), color: "#ef4444" },
                { label: "Avg Risk Score", value: Math.round(audits.reduce((s, a) => s + (a.risk_score || 0), 0) / (audits.length || 1)), color: "var(--text-primary)" },
                { label: "PDF Reports", value: audits.filter(a => a.pdf_available).length, color: "var(--text-primary)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "clamp(16px, 3vw, 20px)",
                  textAlign: "center",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <div style={{
                    fontFamily: "'Satoshi', sans-serif",
                    fontSize: "clamp(26px, 5vw, 30px)",
                    fontWeight: 800,
                    color,
                    marginBottom: 6,
                    letterSpacing: "-0.02em",
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontSize: "clamp(11px, 2vw, 12px)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "'Satoshi', sans-serif",
                    fontWeight: 600,
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {audits.length === 0 ? (
            <div style={{ 
              background: "var(--card)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-lg)", 
              padding: "clamp(48px, 10vw, 72px) 24px", 
              textAlign: "center", 
              boxShadow: "var(--shadow-card)" 
            }}>
              <div style={{ 
                width: "clamp(48px, 10vw, 64px)", 
                height: "clamp(48px, 10vw, 64px)", 
                borderRadius: "var(--radius-lg)", 
                background: isLight ? "rgba(99,102,241,0.06)" : "var(--brand-faint)", 
                border: "1px solid rgba(99,102,241,0.15)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                margin: "0 auto 20px" 
              }}>
                <FileText size={28} style={{ color: "var(--brand)" }} />
              </div>
              <h3 style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "clamp(18px, 4vw, 20px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
                marginBottom: 10
              }}>
                No audits yet
              </h3>
              <p style={{
                fontSize: "clamp(13px, 3vw, 14px)",
                color: "var(--text-muted)",
                marginBottom: 24,
                lineHeight: 1.7,
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 500,
              }}>
                Run your first smart contract audit to see results here.
              </p>
              <Link href="/dashboard/scan" prefetch={true} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "var(--brand)",
                color: "#fff",
                borderRadius: "var(--radius)",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "clamp(13px, 3vw, 14px)",
                fontWeight: 700,
                textDecoration: "none"
              }}>
                <Plus size={15} /> Start Your First Audit
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {audits.map(audit => {
                const rs = riskColors(audit.risk_level, audit.risk_score, isLight);
                const vc = verdictColors(audit.deployment_verdict, isLight);
                const cc = chainColor(audit.chain);
                const cLabel = chainLabel(audit.chain);

                return (
                  <div key={audit.id}
                    onClick={() => router.push(`/dashboard/audit/results/${audit.id}`)}
                    className="audit-row"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "clamp(14px, 3vw, 18px) clamp(16px, 4vw, 20px)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      boxShadow: "var(--shadow-card)",
                      transition: "box-shadow 0.15s, border-color 0.15s",
                      flexWrap: "wrap"
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                    }}
                  >
                    {/* Chain icon — actual blockchain network logo */}
                    <div
                      title={cLabel}
                      style={{
                        width: "clamp(44px, 8vw, 52px)",
                        height: "clamp(44px, 8vw, 52px)",
                        borderRadius: "50%",
                        background: cc.bg,
                        border: `1.5px solid ${cc.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ChainIcon chain={audit.chain} size={26} style={{ color: cc.color }} />
                    </div>

                    {/* Info */}
                    <div className="audit-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "'Satoshi', sans-serif",
                          fontSize: "clamp(15px, 3.5vw, 17px)",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.01em",
                        }}>
                          {audit.contract_name}
                        </span>
                        <span style={{
                          fontSize: "clamp(11px, 2.4vw, 12px)",
                          padding: "3px 9px",
                          borderRadius: 5,
                          background: cc.bg,
                          border: `1px solid ${cc.border}`,
                          color: cc.color,
                          fontFamily: "'Satoshi', sans-serif",
                          fontWeight: 700,
                          letterSpacing: "0.01em",
                        }}>
                          {cLabel}
                        </span>
                        <span style={{
                          fontSize: "clamp(11px, 2.4vw, 12px)",
                          padding: "3px 9px",
                          borderRadius: 5,
                          background: rs.bg,
                          border: `1px solid ${rs.border}`,
                          color: rs.color,
                          fontFamily: "'Satoshi', sans-serif",
                          fontWeight: 800,
                        }}>
                          {audit.risk_score}/100
                        </span>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "clamp(10px, 2vw, 16px)",
                        flexWrap: "wrap",
                        fontSize: "clamp(12px, 2.6vw, 13px)",
                        color: "var(--text-muted)",
                        fontFamily: "'Satoshi', sans-serif",
                        fontWeight: 500,
                      }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Calendar size={13} />{relTime(audit.created_at)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Clock size={13} />{Math.round(audit.scan_duration_ms / 1000)}s
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <TrendingUp size={13} />{audit.plan_used}
                        </span>
                      </div>
                    </div>

                    {/* Finding chips */}
                    <div className="finding-chips" style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      {audit.critical_count > 0 && (
                        <span style={{
                          fontSize: "clamp(11px, 2.4vw, 12px)",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: isLight ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.12)",
                          color: "#ef4444",
                          fontFamily: "'Satoshi', sans-serif",
                          fontWeight: 700,
                        }}>
                          {audit.critical_count} Critical
                        </span>
                      )}
                      {audit.high_count > 0 && (
                        <span style={{
                          fontSize: "clamp(11px, 2.4vw, 12px)",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: isLight ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0.12)",
                          color: "#f97316",
                          fontFamily: "'Satoshi', sans-serif",
                          fontWeight: 700,
                        }}>
                          {audit.high_count} High
                        </span>
                      )}
                      {audit.medium_count > 0 && (
                        <span style={{
                          fontSize: "clamp(11px, 2.4vw, 12px)",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: isLight ? "rgba(234,179,8,0.10)" : "rgba(234,179,8,0.12)",
                          color: "#ca8a04",
                          fontFamily: "'Satoshi', sans-serif",
                          fontWeight: 700,
                        }}>
                          {audit.medium_count} Med
                        </span>
                      )}
                      <span style={{
                        fontSize: "clamp(12px, 2.6vw, 13px)",
                        color: "var(--text-muted)",
                        fontFamily: "'Satoshi', sans-serif",
                        fontWeight: 500,
                      }}>
                        {audit.total_findings} total
                      </span>
                    </div>

                    {/* Verdict */}
                    {audit.deployment_verdict && (
                      <span style={{
                        fontSize: "clamp(11px, 2.4vw, 12px)",
                        padding: "4px 12px",
                        borderRadius: 6,
                        background: vc.bg,
                        color: vc.color,
                        border: `1px solid ${vc.border}`,
                        fontFamily: "'Satoshi', sans-serif",
                        fontWeight: 700,
                        flexShrink: 0,
                        whiteSpace: "nowrap"
                      }}>
                        {audit.deployment_verdict}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="audit-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {audit.pdf_available && (
                        <button onClick={e => downloadPdf(audit.id, audit.contract_name, e)}
                          style={{
                            width: "clamp(34px, 6vw, 38px)",
                            height: "clamp(34px, 6vw, 38px)",
                            borderRadius: "var(--radius-sm)",
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.15s, color 0.15s"
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "var(--elevated)";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "none";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                          }}
                        >
                          {dlId === audit.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/audit/results/${audit.id}`); }}
                        style={{
                          width: "clamp(34px, 6vw, 38px)",
                          height: "clamp(34px, 6vw, 38px)",
                          borderRadius: "var(--radius-sm)",
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 0.15s, color 0.15s"
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = "var(--elevated)";
                          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = "none";
                          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <ChevronRight size={18} style={{ color: "var(--text-disabled)" }} />
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