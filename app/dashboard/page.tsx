"use client";
// app/dashboard/page.tsx — Dashboard Overview

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Star,
  Zap,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  TrendingUp,
  FileText,
} from "lucide-react";

interface DashboardStats {
  stats: {
    totalAudits: number;
    completedAudits: number;
    pendingAudits: number;
    averageScore: number;
    remainingAudits: number | null;
    currentMonthAudits: number;
  };
  recentAudits: Array<{
    id: string;
    contractName: string;
    status: string;
    score: number;
    createdAt: string;
  }>;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  };
}

const riskColors = (score: number) => {
  if (score >= 80) return { color: "#ef4444", border: "rgba(239,68,68,0.25)", bg: "rgba(239,68,68,0.08)", text: "Critical" };
  if (score >= 60) return { color: "#f97316", border: "rgba(249,115,22,0.25)", bg: "rgba(249,115,22,0.08)", text: "High" };
  if (score >= 35) return { color: "#ca8a04", border: "rgba(234,179,8,0.25)", bg: "rgba(234,179,8,0.08)", text: "Medium" };
  if (score >= 10) return { color: "#3b82f6", border: "rgba(59,130,246,0.25)", bg: "rgba(59,130,246,0.08)", text: "Low" };
  return { color: "#10b981", border: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.08)", text: "Good" };
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return { icon: CheckCircle, label: "Complete", color: "#10b981", bg: "rgba(16,185,129,0.08)" };
    case "PROCESSING":
      return { icon: Loader2, label: "Processing", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" };
    case "FAILED":
      return { icon: XCircle, label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.08)" };
    default:
      return { icon: Clock, label: "Pending", color: "#6b7280", bg: "rgba(107,114,128,0.08)" };
  }
};

const relTime = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(d).toLocaleDateString();
};

export default function DashboardOverview() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats;
  const recentAudits = data?.recentAudits || [];
  const subscription = data?.subscription;
  const averageScore = stats?.averageScore || 0;
  const riskInfo = riskColors(averageScore);

  const statCards = [
    { label: "Total Audits",  value: stats?.totalAudits ?? 0,       icon: Shield      },
    { label: "Completed",     value: stats?.completedAudits ?? 0,    icon: CheckCircle },
    { label: "Pending",       value: stats?.pendingAudits ?? 0,      icon: Clock       },
    { label: "Avg Score",     value: (averageScore).toFixed(0), suffix: "/100", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-lg bg-elevated animate-pulse" />
            <div className="h-4 w-40 rounded-lg bg-elevated animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded-lg bg-elevated animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-elevated animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-80 rounded-xl bg-elevated animate-pulse" />
          <div className="h-80 rounded-xl bg-elevated animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 px-6 text-center">
        <AlertTriangle size={44} className="mx-auto mb-5" style={{ color: "#ef4444" }} />
        <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-sans">
          Error Loading Dashboard
        </h3>
        <p className="text-sm text-text-muted mb-6 font-sans">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold font-sans"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-1 font-sans">
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-xs sm:text-sm text-text-muted font-sans">
            Here's your security audit overview and recent activity.
          </p>
        </div>
        <Link
          href="/dashboard/scan"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold font-sans whitespace-nowrap transition-opacity hover:opacity-90"
        >
          <Plus size={13} /> New Audit
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ label, value, suffix, icon: Icon }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-text-muted font-sans">
                {label}
              </span>
              <Icon size={14} className="text-text-muted" />
            </div>
            <div
              className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans mb-1"
              style={{ color: label === "Avg Score" ? riskInfo.color : "var(--text-primary)" }}
            >
              {value}{suffix || ""}
            </div>
            {label === "Avg Score" && averageScore > 0 && (
              <div className="mt-3">
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${averageScore}%`, background: riskInfo.color }}
                  />
                </div>
                <span
                  className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-semibold font-sans"
                  style={{ background: riskInfo.bg, color: riskInfo.color }}
                >
                  {riskInfo.text} Risk
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Audits */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-text-primary font-sans">Recent Audits</h3>
              <p className="text-[11px] text-text-muted font-sans">Your most recent security audit reports</p>
            </div>
            {recentAudits.length > 0 && (
              <Link href="/dashboard/history" className="text-[11px] text-brand font-sans">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold font-sans"
                >
                  <Plus size={12} /> Start First Audit
                </Link>
              </div>
            ) : (
              recentAudits.map((audit, idx) => {
                const risk = riskColors(audit.score);
                const status = getStatusConfig(audit.status);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={audit.id}
                    onClick={() => router.push(`/dashboard/audit/results/${audit.id}`)}
                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-elevated ${
                      idx < recentAudits.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    {/* Score circle */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ border: `2px solid ${risk.border}`, background: risk.bg }}
                    >
                      <span className="text-sm font-extrabold font-sans" style={{ color: risk.color }}>
                        {audit.score}
                      </span>
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
                          <StatusIcon
                            size={10}
                            style={status.label === "Processing" ? { animation: "spin 1s linear infinite" } : {}}
                          />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-text-muted font-sans">
                        <Calendar size={9} />
                        {relTime(audit.createdAt)}
                      </div>
                    </div>

                    <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Plan & Usage */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h3 className="text-sm font-bold tracking-tight text-text-primary font-sans">Plan & Usage</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(99,102,241,0.1)] text-[var(--primary)] font-semibold uppercase font-sans">
                {subscription?.plan || "FREE"}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-text-muted font-sans mb-1.5 flex-wrap gap-1">
                <span>Audits this month</span>
                <span className="text-text-primary">
                  {stats?.currentMonthAudits || 0}
                  {subscription?.plan === "FREE" && <span className="text-text-muted"> / 3</span>}
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${
                      subscription?.plan === "FREE"
                        ? ((stats?.currentMonthAudits || 0) / 3) * 100
                        : Math.min(((stats?.currentMonthAudits || 0) / 100) * 100, 100)
                    }%`,
                  }}
                />
              </div>
            </div>

            {subscription?.plan === "FREE" && stats?.remainingAudits !== null && (
              <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2.5 rounded-lg bg-elevated mb-4">
                <span className="text-[10px] text-text-muted font-sans">Remaining free audits</span>
                <span className="text-base font-bold text-text-primary font-sans">
                  {stats?.remainingAudits}
                </span>
              </div>
            )}

            {subscription?.plan === "FREE" ? (
              <Link
                href="/pricing"
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
                { icon: Shield, label: "New Security Audit",  href: "/dashboard/scan"    },
                { icon: Eye,    label: "View Audit History",  href: "/dashboard/history" },
                { icon: Star,   label: "Upgrade Plan",        href: "/pricing"           },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
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
                <h4 className="text-xs font-bold tracking-tight text-text-primary font-sans mb-1">
                  Security Tip
                </h4>
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
