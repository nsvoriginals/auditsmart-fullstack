"use client";
// app/dashboard/page.tsx — Client-rendered dashboard overview
// Page shell renders INSTANTLY from JS bundle. Data hydrates via Jotai atoms
// backed by localStorage, so repeat visits show last-known values immediately
// and refresh in the background. No server roundtrip blocks navigation.

import React from "react";
import Link from "next/link";
import {
  Shield, AlertTriangle, Clock, Plus, Eye, Star, Zap,
  ArrowRight, CheckCircle, XCircle, Calendar, TrendingUp, FileText,
} from "lucide-react";
import { useDashboard } from "@/lib/state/dashboard";

const riskColors = (score: number) => {
  if (score >= 80) return { color: "#ef4444", border: "rgba(239,68,68,0.25)", bg: "rgba(239,68,68,0.08)", text: "Critical" };
  if (score >= 60) return { color: "#f97316", border: "rgba(249,115,22,0.25)", bg: "rgba(249,115,22,0.08)", text: "High" };
  if (score >= 35) return { color: "#ca8a04", border: "rgba(234,179,8,0.25)", bg: "rgba(234,179,8,0.08)", text: "Medium" };
  if (score >= 10) return { color: "#3b82f6", border: "rgba(59,130,246,0.25)", bg: "rgba(59,130,246,0.08)", text: "Low" };
  return { color: "#10b981", border: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.08)", text: "Good" };
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "COMPLETED":  return { label: "Complete",   color: "#10b981", bg: "rgba(16,185,129,0.08)" };
    case "PROCESSING": return { label: "Processing", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" };
    case "FAILED":     return { label: "Failed",     color: "#ef4444", bg: "rgba(239,68,68,0.08)" };
    default:           return { label: "Pending",    color: "#6b7280", bg: "rgba(107,114,128,0.08)" };
  }
};

const relTime = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString();
};

function StatCard({ label, value, suffix, Icon, scoreColor, scoreBg, scoreText, score }: {
  label: string; value: React.ReactNode; suffix?: string; Icon: any;
  scoreColor?: string; scoreBg?: string; scoreText?: string; score?: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-text-muted font-sans">
          {label}
        </span>
        <Icon size={14} className="text-text-muted" />
      </div>
      <div
        className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans mb-1"
        style={{ color: scoreColor ?? "var(--text-primary)" }}
      >
        {value}{suffix || ""}
      </div>
      {scoreText && score! > 0 && (
        <div className="mt-3">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <span
            className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-semibold font-sans"
            style={{ background: scoreBg, color: scoreColor }}
          >
            {scoreText} Risk
          </span>
        </div>
      )}
    </div>
  );
}

function StatSkeleton() {
  return <div className="bg-card border border-border rounded-xl p-4 h-[104px] animate-pulse" />;
}

function RecentAuditSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="h-4 w-32 bg-elevated rounded animate-pulse mb-2" />
        <div className="h-3 w-48 bg-elevated rounded animate-pulse" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0">
          <div className="w-11 h-11 rounded-full bg-elevated animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-40 bg-elevated rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-elevated rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
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

  const statCards = [
    { label: "Total Audits", value: totalAudits,                          Icon: Shield      },
    { label: "Completed",    value: stats?.completedAudits ?? 0,          Icon: CheckCircle },
    { label: "Pending",      value: stats?.pendingAudits ?? 0,            Icon: Clock       },
  ];

  const showSkeleton = loading && !data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-1 font-sans">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-muted font-sans">
            Your security audit overview and recent activity.
          </p>
        </div>
        <Link
          href="/dashboard/scan"
          prefetch
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold font-sans whitespace-nowrap transition-opacity hover:opacity-90"
        >
          <Plus size={13} /> New Audit
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {showSkeleton ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            {statCards.map(({ label, value, Icon }) => (
              <StatCard key={label} label={label} value={value} Icon={Icon} />
            ))}
            <StatCard
              label="Avg Score"
              value={averageScore.toFixed(0)}
              suffix="/100"
              Icon={TrendingUp}
              scoreColor={riskInfo.color}
              scoreBg={riskInfo.bg}
              scoreText={riskInfo.text}
              score={averageScore}
            />
          </>
        )}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Audits */}
        {showSkeleton ? <RecentAuditSkeleton /> : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-text-primary font-sans">Recent Audits</h3>
                <p className="text-[11px] text-text-muted font-sans">Your most recent security audit reports</p>
              </div>
              {recentAudits.length > 0 && (
                <Link href="/dashboard/history" prefetch className="text-[11px] text-brand font-sans">
                  View all →
                </Link>
              )}
            </div>

            <div>
              {recentAudits.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center mx-auto mb-4">
                    <FileText size={22} className="text-brand" />
                  </div>
                  <p className="text-sm text-text-muted mb-4 font-sans">No audits yet. Run your first scan.</p>
                  <Link
                    href="/dashboard/scan"
                    prefetch
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold font-sans"
                  >
                    <Plus size={12} /> Start First Audit
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
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-elevated ${
                        idx < recentAudits.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: `2px solid ${risk.border}`, background: risk.bg }}
                      >
                        <span className="text-sm font-extrabold font-sans" style={{ color: risk.color }}>{score}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs sm:text-sm font-bold tracking-tight text-text-primary font-sans truncate">
                            {audit.contractName}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-sans"
                            style={{ background: status.bg, color: status.color }}
                          >
                            <StatusDot size={10} />
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-sans">
                          <Calendar size={9} />
                          {relTime(audit.createdAt)}
                        </div>
                      </div>

                      <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Plan & Usage */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h3 className="text-sm font-bold tracking-tight text-text-primary font-sans">Plan &amp; Usage</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(99,102,241,0.1)] text-[var(--primary)] font-semibold uppercase font-sans">
                {plan}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-text-muted font-sans mb-1.5 flex-wrap gap-1">
                <span>Audits this month</span>
                <span className="text-text-primary">
                  {currentMonth}
                  {plan === "FREE" && <span className="text-text-muted"> / 3</span>}
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      plan === "FREE"
                        ? Math.min((currentMonth / 3) * 100, 100)
                        : Math.min((currentMonth / 100) * 100, 100)
                    }%`,
                  }}
                />
              </div>
            </div>

            {plan === "FREE" && remainingAudits !== null && (
              <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2.5 rounded-lg bg-elevated mb-4">
                <span className="text-[10px] text-text-muted font-sans">Remaining free audits</span>
                <span className="text-base font-bold text-text-primary font-sans">{remainingAudits}</span>
              </div>
            )}

            {plan === "FREE" ? (
              <Link
                href="/dashboard/billing"
                prefetch
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-primary text-white text-xs font-semibold font-sans"
              >
                <Zap size={12} /> Upgrade for more audits
              </Link>
            ) : (
              <p className="text-[10px] text-text-muted text-center font-sans">
                Renews on {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "N/A"}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-bold tracking-tight text-text-primary font-sans mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-1.5">
              {[
                { Icon: Shield, label: "New Security Audit",  href: "/dashboard/scan"    },
                { Icon: Eye,    label: "View Audit History",  href: "/dashboard/history" },
                { Icon: Star,   label: "Upgrade Plan",        href: "/dashboard/billing" },
              ].map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  prefetch
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-secondary text-xs font-sans transition-colors hover:bg-elevated"
                >
                  <Icon size={14} className="text-brand" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Security tip */}
          <div className="rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.04)] p-4">
            <div className="flex gap-3">
              <Shield size={18} className="text-brand flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold tracking-tight text-text-primary font-sans mb-1">Security Tip</h4>
                <p className="text-[11px] text-text-muted leading-relaxed font-sans">
                  Regular audits are crucial for contract security. Run audits after every major update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
