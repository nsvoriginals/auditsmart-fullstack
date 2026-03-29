"use client";
// src/app/dashboard/page.tsx — Overview

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { RiskRing, SkeletonCard, PlanBadge } from "@/components/ui";

interface Stats {
  total_audits: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  total_vulnerabilities: number;
  avg_risk_score: number;
  avg_scan_duration_ms: number;
  free_audits_remaining: number;
  plan: string;
}

interface RecentAudit {
  id: string;
  contract_name: string;
  risk_level: string;
  risk_score: number;
  total_findings: number;
  critical_count: number;
  plan_used: string;
  created_at: string;
}

const RISK_COLOR: Record<string, string> = {
  critical: "#f87171", high: "#fb923c", medium: "#facc15",
  low: "#4ade80", safe: "#4ade80", unknown: "var(--text-muted)",
};

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then(r => r.json()),
      fetch("/api/audit/history?limit=5").then(r => r.json()),
    ]).then(([s, h]) => {
      setStats(s);
      setRecent(h.audits ?? []);
      setLoading(false);
    });
  }, []);

  const STAT_CARDS = [
    { label: "Total Audits",    value: stats?.total_audits ?? 0,           sub: "all time" },
    { label: "Vulnerabilities", value: stats?.total_vulnerabilities ?? 0,  sub: "found" },
    { label: "Critical Findings", value: stats?.critical_findings ?? 0,    sub: "high priority", accent: true },
    { label: "Avg Risk Score", value: stats?.avg_risk_score ?? 0,           sub: "/ 100" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1" style={{ color: "var(--frost)" }}>
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "—"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Here&apos;s your security overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PlanBadge plan={session?.user?.plan ?? "free"} />
          <Link href="/dashboard/scan" className="btn btn-primary btn-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Audit
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          STAT_CARDS.map((s) => (
            <div key={s.label} className={`stat-card ${s.accent && (stats?.critical_findings ?? 0) > 0 ? "border-red-900/30" : ""}`}>
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.accent && (stats?.critical_findings ?? 0) > 0 ? "#f87171" : "var(--frost)" }}>
                {typeof s.value === "number" && s.label.includes("Score") ? s.value.toFixed(1) : s.value}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.sub}</span>
            </div>
          ))
        )}
      </div>

      {/* Two column section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent audits */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">Recent Audits</h2>
            <Link href="/dashboard/history" className="text-xs" style={{ color: "var(--plum-light)" }}>View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : recent.length === 0 ? (
            <div className="py-12 text-center">
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No audits yet.</p>
              <Link href="/dashboard/scan" className="btn btn-primary btn-sm mt-4">Run your first audit</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((a) => (
                <Link key={a.id} href={`/dashboard/history/${a.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer"
                  style={{ borderRadius: "var(--radius-sm)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <RiskRing score={a.risk_score ?? 0} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{a.contract_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {a.total_findings} findings · {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.critical_count > 0 && (
                      <span className="badge badge-critical">{a.critical_count} CRIT</span>
                    )}
                    <span className="text-xs font-mono capitalize" style={{ color: RISK_COLOR[a.risk_level] ?? "var(--text-muted)" }}>
                      {a.risk_level}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        <div className="space-y-4">
          {/* Quota card */}
          <div className="card p-5">
            <h3 className="section-title text-base mb-3">Plan & Quota</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Audits remaining</span>
              <span className="font-mono text-sm font-medium" style={{ color: "var(--frost)" }}>
                {session?.user?.free_audits_remaining ?? 0}
              </span>
            </div>
            <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, ((session?.user?.free_audits_remaining ?? 0) / 20) * 100)}%`,
                background: "linear-gradient(90deg, var(--plum), var(--rose))",
                borderRadius: 3,
              }} />
            </div>
            {session?.user?.plan === "free" && (
              <Link href="/pricing" className="btn btn-outline btn-sm w-full">
                Upgrade for more audits
              </Link>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="section-title text-base mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/scan" className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                Scan a contract
              </Link>
              <Link href="/dashboard/monitor" className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Monitor address
              </Link>
              <Link href="/pricing" className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}