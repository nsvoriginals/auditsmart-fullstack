"use client";
// app/dashboard/page.tsx — Dashboard Overview

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Plus, 
  Eye, 
  Star,
  Zap,
  Brain,
  Sparkles
} from "lucide-react";

// Types for dashboard data
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

// Helper to get risk level from score
const getRiskLevel = (score: number) => {
  if (score >= 80) return { text: "Critical", color: "text-red-500 bg-red-500/10", border: "border-red-500/20" };
  if (score >= 60) return { text: "High", color: "text-orange-500 bg-orange-500/10", border: "border-orange-500/20" };
  if (score >= 35) return { text: "Medium", color: "text-yellow-500 bg-yellow-500/10", border: "border-yellow-500/20" };
  if (score >= 10) return { text: "Low", color: "text-blue-500 bg-blue-500/10", border: "border-blue-500/20" };
  return { text: "Good", color: "text-green-500 bg-green-500/10", border: "border-green-500/20" };
};

// Helper to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-400">✓ Complete</span>;
    case "PROCESSING":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-500/10 text-yellow-400">⟳ Processing</span>;
    case "FAILED":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400">✗ Failed</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400">○ Pending</span>;
  }
};

export default function DashboardOverview() {
  const { data: session } = useSession();
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
      console.error("Error fetching dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats;
  const recentAudits = data?.recentAudits || [];
  const subscription = data?.subscription;
  const averageScore = stats?.averageScore || 0;
  const riskInfo = getRiskLevel(averageScore);
  
  // Get plan icon and color
  const getPlanInfo = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "pro":
        return { icon: Zap, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500/10", textColor: "text-blue-400" };
      case "enterprise":
        return { icon: Brain, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-500/10", textColor: "text-purple-400" };
      case "deep_audit":
        return { icon: Sparkles, color: "from-amber-500 to-amber-600", bgColor: "bg-amber-500/10", textColor: "text-amber-400" };
      default:
        return { icon: Shield, color: "from-green-500 to-green-600", bgColor: "bg-green-500/10", textColor: "text-green-400" };
    }
  };

  const planInfo = getPlanInfo(subscription?.plan || "FREE");

  // Stat cards configuration
  const statCards = [
    { 
      label: "Total Audits", 
      value: stats?.totalAudits || 0, 
      sub: "all time",
      icon: Shield,
      color: "text-[var(--plum-light)]"
    },
    { 
      label: "Completed", 
      value: stats?.completedAudits || 0, 
      sub: "successful audits",
      icon: TrendingUp,
      color: "text-green-400"
    },
    { 
      label: "Pending", 
      value: stats?.pendingAudits || 0, 
      sub: "in progress",
      icon: Clock,
      color: "text-yellow-400"
    },
    { 
      label: "Avg Score", 
      value: averageScore.toFixed(1), 
      sub: "/ 100",
      icon: AlertTriangle,
      color: riskInfo.color.split(' ')[0]
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--frost)" }}>
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Here's your security audit overview and recent activity.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Plan Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${planInfo.bgColor}`}>
            <planInfo.icon className={`w-4 h-4 ${planInfo.textColor}`} />
            <span className={`text-sm font-medium capitalize ${planInfo.textColor}`}>
              {subscription?.plan?.toLowerCase() || "free"}
            </span>
          </div>
          
          {/* New Audit Button */}
          <Link 
            href="/dashboard/audit" 
            className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Audit
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-[var(--bg-input)] rounded w-24 mb-3"></div>
              <div className="h-8 bg-[var(--bg-input)] rounded w-16 mb-2"></div>
              <div className="h-3 bg-[var(--bg-input)] rounded w-20"></div>
            </div>
          ))
        ) : (
          statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-5 hover:border-[var(--plum-light)]/50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-[var(--plum)]/10`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  {card.label === "Avg Score" && averageScore > 0 && (
                    <div className={`text-xs px-2 py-0.5 rounded-full ${riskInfo.color}`}>
                      {riskInfo.text}
                    </div>
                  )}
                </div>
                <div className="stat-value text-2xl font-bold" style={{ color: "var(--frost)" }}>
                  {card.value}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {card.sub}
                </div>
                {card.label === "Avg Score" && averageScore > 0 && (
                  <div className="mt-2 w-full bg-[var(--bg-input)] rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all bg-gradient-to-r from-green-500 to-[var(--plum-light)]"
                      style={{ width: `${averageScore}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Audits - Left Column */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title text-lg font-semibold" style={{ color: "var(--frost)" }}>
              Recent Audits
            </h2>
            <Link 
              href="/dashboard/history" 
              className="text-xs hover:underline transition-all"
              style={{ color: "var(--plum-light)" }}
            >
              View all →
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-3 rounded-lg animate-pulse">
                  <div className="h-5 bg-[var(--bg-input)] rounded w-32 mb-2"></div>
                  <div className="h-3 bg-[var(--bg-input)] rounded w-48"></div>
                </div>
              ))}
            </div>
          ) : recentAudits.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No audits yet.</p>
              <Link 
                href="/dashboard/audit" 
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white text-sm hover:opacity-90 transition-all"
              >
                Run your first audit
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAudits.map((audit) => {
                const auditRisk = getRiskLevel(audit.score);
                return (
                  <Link
                    key={audit.id}
                    href={`/dashboard/audit/results/${audit.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer hover:bg-[var(--bg-hover)]"
                  >
                    {/* Risk Ring (simplified) */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${auditRisk.border}`}>
                        <span className="text-xs font-medium" style={{ color: auditRisk.color.split(' ')[0] }}>
                          {audit.score}
                        </span>
                      </div>
                    </div>
                    
                    {/* Audit Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {audit.contractName}
                        </p>
                        {getStatusBadge(audit.status)}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Risk Level */}
                    <div className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${auditRisk.color}`}>
                      {auditRisk.text}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Plan & Quick Actions */}
        <div className="space-y-4">
          {/* Plan & Quota Card */}
          <div className="card p-5">
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--frost)" }}>
              Plan & Usage
            </h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Audits this month
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--frost)" }}>
                {stats?.currentMonthAudits || 0}
                {subscription?.plan === "FREE" && <span className="text-xs text-[var(--text-muted)]"> / 3</span>}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "var(--bg-hover)" }}>
              <div 
                className="h-full rounded-full transition-all bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)]"
                style={{ 
                  width: subscription?.plan === "FREE" 
                    ? `${Math.min(100, ((stats?.currentMonthAudits || 0) / 3) * 100)}%` 
                    : `${Math.min(100, ((stats?.currentMonthAudits || 0) / 100) * 100)}%`
                }}
              />
            </div>
            
            {/* Remaining */}
            {subscription?.plan === "FREE" && stats?.remainingAudits !== null && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Remaining free audits
                  </span>
                  <span className="text-lg font-bold" style={{ color: "var(--frost)" }}>
                    {stats.remainingAudits}
                  </span>
                </div>
              </div>
            )}
            
            {/* Upgrade Button */}
            {subscription?.plan === "FREE" && (
              <Link 
                href="/dashboard/pricing" 
                className="w-full py-2 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white text-sm font-medium text-center hover:opacity-90 transition-all block"
              >
                Upgrade for more audits
              </Link>
            )}
            
            {/* Subscription Info */}
            {subscription?.plan !== "FREE" && subscription?.currentPeriodEnd && (
              <div className="mt-3 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="card p-5">
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--frost)" }}>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link 
                href="/dashboard/audit" 
                className="flex items-center gap-3 w-full p-2 rounded-lg transition-all hover:bg-[var(--bg-hover)]"
              >
                <div className="p-1.5 rounded-md bg-[var(--plum)]/10">
                  <Shield className="w-4 h-4 text-[var(--plum-light)]" />
                </div>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>New Security Audit</span>
              </Link>
              
              <Link 
                href="/dashboard/history" 
                className="flex items-center gap-3 w-full p-2 rounded-lg transition-all hover:bg-[var(--bg-hover)]"
              >
                <div className="p-1.5 rounded-md bg-[var(--plum)]/10">
                  <Eye className="w-4 h-4 text-[var(--plum-light)]" />
                </div>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>View Audit History</span>
              </Link>
              
              <Link 
                href="/dashboard/pricing" 
                className="flex items-center gap-3 w-full p-2 rounded-lg transition-all hover:bg-[var(--bg-hover)]"
              >
                <div className="p-1.5 rounded-md bg-[var(--plum)]/10">
                  <Star className="w-4 h-4 text-[var(--plum-light)]" />
                </div>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>Upgrade Plan</span>
              </Link>
            </div>
          </div>
          
          {/* Security Tip */}
          <div className="card p-4" style={{ background: "linear-gradient(135deg, rgba(97,45,83,0.1) 0%, rgba(97,45,83,0.05) 100%)" }}>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[var(--plum-light)] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium mb-1" style={{ color: "var(--frost)" }}>Security Tip</h4>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
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