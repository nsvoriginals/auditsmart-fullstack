// app/dashboard/history/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Download, 
  Plus, 
  ChevronRight,
  Calendar,
  Hash,
  TrendingUp,
  Clock,
  FileText
} from "lucide-react";

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

export default function HistoryPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const response = await fetch("/api/audit/history?limit=50");
      const data = await response.json();
      setAudits(data.audits ?? []);
    } catch (error) {
      console.error("Failed to fetch audits:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking download
    setDownloadingId(id);
    
    try {
      const response = await fetch(`/api/audit/report/${id}/pdf`);
      
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit_Report_${name.replace(/[^a-z0-9]/gi, "_")}_${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const viewAudit = (id: string) => {
    router.push(`/dashboard/audit/results/${id}`);
  };

  const getRiskColor = (level: string, score: number) => {
    if (level === "critical" || score >= 70) return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", light: "bg-red-500/5" };
    if (level === "high" || score >= 50) return { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20", light: "bg-orange-500/5" };
    if (level === "medium" || score >= 30) return { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20", light: "bg-yellow-500/5" };
    return { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", light: "bg-green-500/5" };
  };

  const getVerdictColor = (verdict: string) => {
    const v = verdict?.toLowerCase() || "";
    if (v.includes("safe")) return { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" };
    if (v.includes("caution")) return { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20" };
    if (v.includes("not") || v.includes("do not")) return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" };
    return { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500/20" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-[var(--bg-input)] rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-[var(--bg-input)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-input)] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--frost)]">Audit History</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            View and manage all your past smart contract security audits
          </p>
        </div>
        <Link
          href="/dashboard/scan"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Audit
        </Link>
      </div>

      {/* Stats Summary */}
      {audits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-bold text-[var(--frost)]">{audits.length}</div>
            <div className="text-xs text-[var(--text-muted)]">Total Audits</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-bold text-red-500">
              {audits.reduce((sum, a) => sum + (a.critical_count || 0), 0)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Critical Issues</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-bold text-[var(--frost)]">
              {Math.round(audits.reduce((sum, a) => sum + (a.risk_score || 0), 0) / (audits.length || 1))}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Avg Risk Score</div>
          </div>
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-bold text-[var(--frost)]">
              {audits.filter(a => a.pdf_available).length}
            </div>
            <div className="text-xs text-[var(--text-muted)]">PDF Reports</div>
          </div>
        </div>
      )}

      {/* Audit List */}
      {audits.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--plum)]/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-[var(--plum-light)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--frost)] mb-2">No audits yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Run your first smart contract audit to see results here
          </p>
          <Link
            href="/dashboard/audit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Start Your First Audit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => {
            const riskStyle = getRiskColor(audit.risk_level, audit.risk_score);
            const verdictStyle = getVerdictColor(audit.deployment_verdict);
            
            return (
              <div
                key={audit.id}
                onClick={() => viewAudit(audit.id)}
                className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 cursor-pointer transition-all hover:border-[var(--plum-light)] hover:shadow-lg hover:shadow-[var(--plum)]/5 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Section - Contract Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Risk Ring */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${riskStyle.border} ${riskStyle.bg}`}>
                        <span className={`text-sm font-bold ${riskStyle.text}`}>{audit.risk_score}</span>
                      </div>
                    </div>
                    
                    {/* Contract Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-semibold text-[var(--frost)] truncate">
                          {audit.contract_name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-muted)] font-mono">
                          {audit.chain}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(audit.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(audit.scan_duration_ms / 1000)}s scan
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <TrendingUp className="w-3 h-3" />
                          {audit.plan_used} plan
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Stats & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4">
                    {/* Finding Stats */}
                    <div className="flex items-center gap-2">
                      {audit.critical_count > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-500">
                          {audit.critical_count}C
                        </span>
                      )}
                      {audit.high_count > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-500/10 text-orange-500">
                          {audit.high_count}H
                        </span>
                      )}
                      {audit.medium_count > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500">
                          {audit.medium_count}M
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">
                        {audit.total_findings} total
                      </span>
                    </div>

                    {/* Verdict Badge */}
                    {audit.deployment_verdict && (
                      <div className={`hidden sm:block px-2 py-1 rounded-md text-xs font-medium ${verdictStyle.bg} ${verdictStyle.text} border ${verdictStyle.border}`}>
                        {audit.deployment_verdict}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {audit.pdf_available && (
                        <button
                          onClick={(e) => downloadPdf(audit.id, audit.contract_name, e)}
                          disabled={downloadingId === audit.id}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                          title="Download PDF"
                        >
                          {downloadingId === audit.id ? (
                            <div className="w-4 h-4 border-2 border-[var(--plum-light)] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewAudit(audit.id);
                        }}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--plum-light)] hover:bg-[var(--plum)]/10 transition-all group-hover:bg-[var(--plum)]/5"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--plum-light)] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}