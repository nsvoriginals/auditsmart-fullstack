"use client";
// src/app/dashboard/history/page.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RiskRing, SeverityBadge, SkeletonCard, EmptyState } from "@/components/ui";

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

const VERDICT_COLOR: Record<string, string> = {
  "safe": "#4ade80", "caution": "#facc15", "do not deploy": "#f87171",
};

export default function HistoryPage() {
  const [audits, setAudits]   = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit/history?limit=20").then(r => r.json()).then(d => {
      setAudits(d.audits ?? []);
      setLoading(false);
    });
  }, []);

  const downloadPdf = async (id: string, name: string) => {
    const res  = await fetch(`/api/audit/report/${id}/pdf`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `AuditSmart_${name}_${id.slice(0,6)}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1" style={{ color: "var(--frost)" }}>Audit History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            All your past smart contract security audits.
          </p>
        </div>
        <Link href="/dashboard/scan" className="btn btn-primary btn-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          New Audit
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : audits.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>}
            title="No audits yet"
            sub="Run your first smart contract audit to see results here."
            action={<Link href="/dashboard/scan" className="btn btn-primary btn-sm">Start scanning</Link>}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs uppercase tracking-wider"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            <div className="col-span-4">Contract</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-2">Findings</div>
            <div className="col-span-2">Verdict</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {audits.map((a) => {
              const verdict = a.deployment_verdict?.toLowerCase() ?? "";
              return (
                <div key={a.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Contract info */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <RiskRing score={a.risk_score} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {a.contract_name}
                      </p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {a.chain} · {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Risk level */}
                  <div className="md:col-span-2">
                    <span className="text-xs font-mono capitalize" style={{ color: "var(--text-secondary)" }}>
                      {a.risk_level}
                    </span>
                  </div>

                  {/* Findings */}
                  <div className="md:col-span-2 flex flex-wrap gap-1">
                    {a.critical_count > 0 && <SeverityBadge severity="critical" />}
                    {a.high_count > 0     && <SeverityBadge severity="high" />}
                    <span className="text-xs" style={{ color: "var(--text-muted)", alignSelf: "center" }}>
                      {a.total_findings} total
                    </span>
                  </div>

                  {/* Verdict */}
                  <div className="md:col-span-2">
                    {verdict && (
                      <span className="text-xs font-mono uppercase"
                        style={{ color: VERDICT_COLOR[verdict] ?? "var(--text-muted)" }}>
                        {a.deployment_verdict}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <Link href={`/dashboard/history/${a.id}`} className="btn btn-ghost btn-sm">View</Link>
                    {a.pdf_available && (
                      <button onClick={() => downloadPdf(a.id, a.contract_name)} className="btn btn-ghost btn-sm" title="Download PDF">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}