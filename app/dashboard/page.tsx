"use client";
// app/dashboard/page.tsx — Client-rendered dashboard overview
// Page shell renders INSTANTLY from JS bundle. Data hydrates via Jotai atoms
// backed by localStorage, so repeat visits show last-known values immediately.

import React from "react";
import Link from "next/link";
import {
  Shield, Clock, Plus, ArrowRight, CheckCircle, XCircle,
  TrendingUp, FileText, Zap, Eye, Star,
} from "lucide-react";
import { useDashboard } from "@/lib/state/dashboard";

const riskColors = (score: number) => {
  if (score >= 80) return { color: "#f47174", bg: "rgba(229,72,77,0.12)", text: "Critical" };
  if (score >= 60) return { color: "#f5a524", bg: "rgba(245,165,36,0.12)", text: "High" };
  if (score >= 35) return { color: "#eab308", bg: "rgba(234,179,8,0.12)", text: "Medium" };
  if (score >= 10) return { color: "#6366f1", bg: "rgba(99,102,241,0.12)", text: "Low" };
  return { color: "#2ebd6b", bg: "rgba(46,189,107,0.12)", text: "Healthy" };
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "COMPLETED":  return { label: "Complete",   color: "#2ebd6b", bg: "rgba(46,189,107,0.12)" };
    case "PROCESSING": return { label: "Processing", color: "#f5a524", bg: "rgba(245,165,36,0.12)" };
    case "FAILED":     return { label: "Failed",     color: "#f47174", bg: "rgba(229,72,77,0.12)" };
    default:           return { label: "Pending",    color: "#8d9199", bg: "rgba(141,145,153,0.12)" };
  }
};

const relTime = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return new Date(iso).toLocaleDateString();
};

const today = () =>
  new Date().toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

/* Big-number stat tile */
function StatTile({ label, value, suffix, color, className = "" }: {
  label: string; value: React.ReactNode; suffix?: string; color?: string; className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 shadow-card flex flex-col justify-between min-h-[140px] ${className}`}>
      <span className="text-[11px] uppercase tracking-wider text-text-muted font-mono">{label}</span>
      <div
        className="font-bold leading-none tracking-tight tabular-nums"
        style={{ fontSize: "clamp(40px, 5vw, 60px)", color: color ?? "var(--text-primary)" }}
      >
        {value}
        {suffix && <span className="text-base font-medium text-text-muted ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

/* Circular gauge for the featured avg-score tile */
function Ring({ score, color }: { score: number; color: string }) {
  const r = 38, c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
      />
      <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, fill: "var(--text-primary)" }}>
        {Math.round(score)}
      </text>
    </svg>
  );
}

function StatSkeleton() {
  return <div className="bg-card border border-border rounded-xl min-h-[140px] skeleton" />;
}

export default function DashboardOverview() {
  const { data, loading } = useDashboard();

  const stats           = data?.stats;
  const recentAudits    = data?.recentAudits ?? [];
  const subscription    = data?.subscription;
  const plan            = subscription?.plan || "FREE";
  const averageScore    = stats?.averageScore ?? 0;
  const riskInfo        = riskColors(averageScore);
  const remainingAudits = stats?.remainingAudits ?? null;
  const totalAudits     = stats?.totalAudits ?? 0;
  const currentMonth    = stats?.currentMonthAudits ?? 0;
  const usagePct        = plan === "FREE" ? Math.min((currentMonth / 3) * 100, 100) : Math.min(currentMonth, 100);

  const showSkeleton = loading && !data;

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[12px] font-mono tracking-wider text-text-muted">{today()}</span>
          <h1 className="font-bold tracking-tight text-text-primary" style={{ fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-0.03em" }}>
            Overview
          </h1>
        </div>
        <Link
          href="/dashboard/scan"
          prefetch
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-[var(--brand-hover)] hover:shadow-brand transition-all duration-150"
        >
          <Plus size={16} /> New Audit
        </Link>
      </div>

      {/* Metric row — featured gauge + big numbers */}
      <div className="grid grid-cols-2 lg:[grid-template-columns:1.5fr_1fr_1fr_1fr] gap-3">
        {showSkeleton ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : (
          <>
            {/* Featured: avg score */}
            <div className="col-span-2 lg:col-span-1 bg-card border border-border rounded-xl p-5 shadow-card flex items-center gap-5 min-h-[140px]">
              <Ring score={averageScore} color={riskInfo.color} />
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-mono">Avg risk score</span>
                <div className="text-2xl font-bold tracking-tight mt-1" style={{ color: riskInfo.color }}>
                  {riskInfo.text}
                </div>
                <span className="text-xs text-text-muted font-mono">across {totalAudits} audits</span>
              </div>
            </div>

            <StatTile label="Total" value={totalAudits} />
            <StatTile label="Completed" value={stats?.completedAudits ?? 0} color="#2ebd6b" />
            <StatTile label="Pending" value={stats?.pendingAudits ?? 0} color={(stats?.pendingAudits ?? 0) > 0 ? "#f5a524" : undefined} />
          </>
        )}
      </div>

      {/* Recent audits + side rail */}
      <div className="grid grid-cols-1 lg:[grid-template-columns:1.6fr_1fr] gap-5">
        {/* Recent audits */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h3 className="text-lg font-semibold tracking-tight text-text-primary">Recent audits</h3>
            {recentAudits.length > 0 && (
              <Link href="/dashboard/history" prefetch className="text-[13px] text-brand hover:underline">
                View all →
              </Link>
            )}
          </div>

          {showSkeleton ? (
            <div className="p-4 flex flex-col gap-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg skeleton" />)}
            </div>
          ) : recentAudits.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-faint border border-[rgba(99,102,241,0.18)] flex items-center justify-center mx-auto mb-5">
                <FileText size={24} className="text-brand" />
              </div>
              <p className="text-base text-text-secondary mb-5">No audits yet.</p>
              <Link
                href="/dashboard/scan"
                prefetch
                className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <Plus size={16} /> Run first audit
              </Link>
            </div>
          ) : (
            recentAudits.map((audit, idx) => {
              const score = audit.score ?? 0;
              const risk = riskColors(score);
              const status = getStatusConfig(audit.status);
              const StatusDot = audit.status === "COMPLETED" ? CheckCircle : audit.status === "FAILED" ? XCircle : Clock;
              return (
                <Link
                  key={audit.id}
                  href={`/dashboard/audit/results/${audit.id}`}
                  prefetch
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[var(--surface-2)] ${
                    idx < recentAudits.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-mono"
                    style={{ background: risk.bg, color: risk.color, fontSize: 17, fontWeight: 500 }}
                  >
                    {score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold tracking-tight text-text-primary truncate">
                      {audit.contractName}
                    </span>
                    <span className="text-xs text-text-muted font-mono">{relTime(audit.createdAt)}</span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md flex-shrink-0"
                    style={{ background: status.bg, color: status.color }}
                  >
                    <StatusDot size={12} />
                    {status.label}
                  </span>
                  <ArrowRight size={16} className="text-text-muted flex-shrink-0" />
                </Link>
              );
            })
          )}
        </div>

        {/* Side rail */}
        <div className="flex flex-col gap-5">
          {/* Usage */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">Usage</h3>
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-brand-faint text-brand font-medium uppercase font-mono">
                {plan}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold tabular-nums tracking-tight" style={{ fontSize: "clamp(36px, 5vw, 52px)" }}>
                {plan === "FREE" && remainingAudits !== null ? remainingAudits : currentMonth}
              </span>
              <span className="text-sm text-text-muted">
                {plan === "FREE" ? "audits left" : "this month"}
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden mt-3 mb-5">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${usagePct}%` }} />
            </div>

            {plan === "FREE" ? (
              <Link
                href="/dashboard/billing"
                prefetch
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-[var(--brand-hover)] transition-all duration-150"
              >
                <Zap size={15} /> Upgrade
              </Link>
            ) : (
              <p className="text-xs text-text-muted font-mono text-center">
                Renews {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "—"}
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { Icon: Shield, label: "Scan", href: "/dashboard/scan" },
              { Icon: Eye, label: "History", href: "/dashboard/history" },
              { Icon: Star, label: "Upgrade", href: "/dashboard/billing" },
            ].map(({ Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                prefetch
                className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-text-secondary hover:text-text-primary hover:border-strong hover:bg-[var(--surface-2)] transition-all duration-150"
              >
                <Icon size={20} className="text-brand" />
                <span className="text-[13px] font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
