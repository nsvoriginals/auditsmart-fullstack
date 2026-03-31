// app/dashboard/audit/results/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  AlertTriangle, Shield, Clock, Brain, CheckCircle, 
  XCircle, AlertCircle, ChevronDown, ChevronUp, 
  Download, ArrowLeft, Loader2, FileText, Share2,
  TrendingUp, Zap, Award, BarChart3
} from "lucide-react";

interface Finding {
  id: string;
  title: string;
  severity: string;
  description: string;
  recommendation: string;
  lineNumber: string | null;
}

interface AuditData {
  id: string;
  contractName: string;
  status: string;
  score: number;
  summary: string;
  report: {
    risk_level: string;
    risk_score: number;
    total_findings: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    info_count: number;
    agents_used: string[];
    scan_duration_ms: number;
    deployment_verdict?: string;
    thinking_chain?: string;
    findings?: Finding[];
    plan_used?: string;
    has_fix_suggestions?: boolean;
  };
  createdAt: string;
  findings: Finding[];
}

export default function AuditResultsPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    fetchAudit();
  }, [auditId]);

  const fetchAudit = async () => {
    try {
      const response = await fetch(`/api/audit/results/${auditId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setAudit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch(`/api/audit/report/${auditId}/pdf`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit_Report_${audit?.contractName?.replace(/[^a-z0-9]/gi, "_") || "contract"}_${auditId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const shareResults = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleFinding = (id: string) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFindings(newExpanded);
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", glow: "shadow-red-500/20" };
      case "high": return { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", glow: "shadow-orange-500/20" };
      case "medium": return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", glow: "shadow-yellow-500/20" };
      case "low": return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", glow: "shadow-blue-500/20" };
      default: return { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", glow: "shadow-green-500/20" };
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
      high: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertTriangle },
      medium: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
      low: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Shield },
      info: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: CheckCircle },
    };
    const c = config[severity.toLowerCase() as keyof typeof config] || config.info;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${c.color}`}>
        <Icon className="w-3 h-3" />
        {severity.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--plum-light)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading audit results...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-red-500">Error</h2>
          </div>
          <p className="text-[var(--text-secondary)]">{error || "Audit not found"}</p>
          <button
            onClick={() => router.push("/dashboard/audit")}
            className="mt-4 px-4 py-2 rounded-md bg-[var(--plum)] text-white hover:bg-[var(--plum-light)] transition-colors"
          >
            Start New Audit
          </button>
        </div>
      </div>
    );
  }

  const report = audit.report;
  const findings = audit.findings || report?.findings || [];
  const riskInfo = getRiskColor(report?.risk_level || "unknown");
  const riskScore = report?.risk_score || audit.score || 0;
  
  // Calculate risk percentage for gauge
  const riskPercentage = riskScore;
  const getRiskGradient = () => {
    if (riskScore >= 70) return "from-red-500 to-red-600";
    if (riskScore >= 40) return "from-orange-500 to-orange-600";
    if (riskScore >= 20) return "from-yellow-500 to-yellow-600";
    return "from-green-500 to-green-600";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard/audit")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--frost)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            New Audit
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={shareResults}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {shareSuccess ? "Copied!" : "Share"}
            </button>
            
            <button
              onClick={downloadPDF}
              disabled={downloadingPDF}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--plum)]/10 border border-[var(--plum)]/20">
            <FileText className="w-3 h-3 text-[var(--plum-light)]" />
            <span className="text-xs font-medium text-[var(--plum-light)]">AUDIT REPORT</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--frost)]">{audit.contractName}</h1>
          <p className="text-[var(--text-secondary)]">
            Completed on {new Date(audit.createdAt).toLocaleDateString()} • 
            <span className="ml-1 font-mono">{report?.scan_duration_ms ? Math.round(report.scan_duration_ms / 1000) : 0}s scan time</span>
          </p>
        </div>

        {/* Risk Score Gauge */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="var(--bg-hover)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#riskGradient)"
                    strokeWidth="12"
                    strokeDasharray={`${(riskPercentage / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[var(--frost)]">{riskScore}</span>
                  <span className="text-xs text-[var(--text-muted)]">/100</span>
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${riskInfo.bg} ${riskInfo.text}`}>
                  {report?.risk_level?.toUpperCase()} RISK
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{report?.critical_count || 0}</div>
                <div className="text-xs text-[var(--text-muted)]">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{report?.high_count || 0}</div>
                <div className="text-xs text-[var(--text-muted)]">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{report?.medium_count || 0}</div>
                <div className="text-xs text-[var(--text-muted)]">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{report?.low_count || 0}</div>
                <div className="text-xs text-[var(--text-muted)]">Low</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <AlertTriangle className="w-4 h-4 text-[var(--plum-light)] mx-auto mb-1" />
            <div className="text-xl font-bold text-[var(--frost)]">{report?.total_findings || findings.length}</div>
            <div className="text-xs text-[var(--text-muted)]">Total Findings</div>
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <Brain className="w-4 h-4 text-[var(--plum-light)] mx-auto mb-1" />
            <div className="text-xl font-bold text-[var(--frost)]">{report?.agents_used?.length || 0}</div>
            <div className="text-xs text-[var(--text-muted)]">AI Agents</div>
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <Zap className="w-4 h-4 text-[var(--plum-light)] mx-auto mb-1" />
            <div className="text-xl font-bold text-[var(--frost)] capitalize">{report?.plan_used || "Free"}</div>
            <div className="text-xs text-[var(--text-muted)]">Plan Used</div>
          </div>
          
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-3 text-center">
            <Award className="w-4 h-4 text-[var(--plum-light)] mx-auto mb-1" />
            <div className="text-xl font-bold text-[var(--frost)]">
              {report?.has_fix_suggestions ? "Yes" : "No"}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Fix Suggestions</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-[var(--plum)]/5 to-transparent rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--frost)] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--plum-light)]" />
            Executive Summary
          </h2>
          <p className="text-[var(--text-primary)] leading-relaxed">{audit.summary}</p>
          
          {report?.deployment_verdict && (
            <div className={`mt-4 p-3 rounded-lg border ${riskInfo.border} ${riskInfo.bg}`}>
              <p className="text-sm">
                <strong className={riskInfo.text}>Deployment Verdict:</strong>{' '}
                <span className="text-[var(--text-primary)]">{report.deployment_verdict}</span>
              </p>
            </div>
          )}
        </div>

        {/* AI Thinking Chain (for Deep Audit) */}
        {report?.thinking_chain && (
          <div className="bg-purple-500/5 rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-400">AI Extended Thinking</h2>
            </div>
            <details className="group">
              <summary className="text-sm text-[var(--text-secondary)] cursor-pointer hover:text-purple-400 transition-colors">
                Click to view Claude Opus reasoning chain
              </summary>
              <div className="mt-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono text-xs">
                  {report.thinking_chain}
                </p>
              </div>
            </details>
          </div>
        )}

        {/* Findings Section */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-hover)]/30">
            <h2 className="text-lg font-semibold text-[var(--frost)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--plum-light)]" />
              Security Findings ({findings.length})
            </h2>
          </div>
          
          {findings.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--frost)] mb-2">No Vulnerabilities Found!</h3>
              <p className="text-[var(--text-secondary)]">Your contract looks secure. Great job!</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {findings.map((finding, idx) => (
                <div key={finding.id || idx} className="transition-all">
                  <button
                    onClick={() => toggleFinding(finding.id || String(idx))}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-all text-left"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      {getSeverityBadge(finding.severity)}
                      <span className="font-medium text-[var(--frost)]">{finding.title}</span>
                      {finding.lineNumber && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-muted)]">
                          Line {finding.lineNumber}
                        </span>
                      )}
                    </div>
                    {expandedFindings.has(finding.id || String(idx)) ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 ml-2" />
                    )}
                  </button>
                  
                  {expandedFindings.has(finding.id || String(idx)) && (
                    <div className="px-6 pb-5 pt-2 border-t border-[var(--border)] bg-[var(--bg-hover)]/20 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Description</h4>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{finding.description}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Recommendation</h4>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="text-sm text-[var(--text-primary)]">{finding.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}