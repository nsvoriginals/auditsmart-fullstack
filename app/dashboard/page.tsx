"use client";
// app/dashboard/page.tsx — Dashboard Overview (Responsive)

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
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  TrendingUp,
  FileText,
  Menu
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
  const riskInfo = riskColors(averageScore);

  const statCards = [
    { label: "Total Audits", value: stats?.totalAudits || 0, icon: Shield },
    { label: "Completed", value: stats?.completedAudits || 0, icon: CheckCircle },
    { label: "Pending", value: stats?.pendingAudits || 0, icon: Clock },
    { label: "Avg Score", value: averageScore.toFixed(0), suffix: "/100", icon: TrendingUp },
  ];

  const Skeleton = () => (
    <div style={{ height: 120, borderRadius: "var(--radius-md)", background: "var(--elevated)", animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div><Skeleton /><div style={{ height: 20, width: 200, marginTop: 8 }}><Skeleton /></div></div>
          <div style={{ width: 120 }}><Skeleton /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          <div><Skeleton /><div style={{ height: 300, marginTop: 12 }}><Skeleton /></div></div>
          <div><Skeleton /><div style={{ height: 300, marginTop: 12 }}><Skeleton /></div></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "72px 24px", textAlign: "center" }}>
        <AlertTriangle size={48} style={{ color: "#ef4444", margin: "0 auto 20px" }} />
        <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 8 }}>Error Loading Dashboard</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, fontFamily: "'Satoshi', sans-serif" }}>{error}</p>
        <button onClick={fetchDashboardData} style={{ padding: "10px 22px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @media (max-width: 640px) {
          .stats-grid { gap: 8px !important; }
          .stats-card { padding: 12px !important; }
          .stats-value { font-size: 24px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(22px, 6vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 4 }}>
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
            Here's your security audit overview and recent activity.
          </p>
        </div>
        <Link href="/dashboard/scan"
          className="whitespace-nowrap"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <Plus size={13} /> New Audit
        </Link>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {statCards.map(({ label, value, suffix, icon: Icon }) => (
          <div key={label} className="stats-card" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 18, boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Satoshi', sans-serif" }}>{label}</span>
              <Icon size={14} style={{ color: "var(--text-muted)" }} />
            </div>
            <div className="stats-value" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em", color: label === "Avg Score" ? riskInfo.color : "var(--text-primary)", marginBottom: 4 }}>
              {value}{suffix || ""}
            </div>
            {label === "Avg Score" && averageScore > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${averageScore}%`, height: "100%", background: riskInfo.color, borderRadius: 2 }} />
                </div>
                <span style={{ display: "inline-block", marginTop: 8, fontSize: 10, padding: "2px 8px", borderRadius: 4, background: riskInfo.bg, color: riskInfo.color, fontFamily: "'Satoshi', sans-serif", fontWeight: 600 }}>
                  {riskInfo.text} Risk
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two Column Layout - Responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {/* Recent Audits */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 2 }}>Recent Audits</h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>Your most recent security audit reports</p>
            </div>
            {recentAudits.length > 0 && (
              <Link href="/dashboard/history" style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none", fontFamily: "'Satoshi', sans-serif" }}>
                View all →
              </Link>
            )}
          </div>
          <div style={{ padding: "8px 0" }}>
            {recentAudits.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--primary-faint)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <FileText size={22} style={{ color: "var(--primary)" }} />
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, fontFamily: "'Satoshi', sans-serif" }}>No audits yet. Run your first scan.</p>
                <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--primary)", color: "#fff", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
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
                    style={{
                      padding: "14px 20px",
                      cursor: "pointer",
                      borderBottom: idx < recentAudits.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--elevated)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      {/* Score Circle */}
                      <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${risk.border}`, background: risk.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 13, fontWeight: 800, color: risk.color }}>{audit.score}</span>
                      </div>
                      
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>{audit.contractName}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 7px", borderRadius: 4, background: status.bg, color: status.color, fontFamily: "'Satoshi', sans-serif" }}>
                            <StatusIcon size={10} style={status.label === "Processing" ? { animation: "spin 1s linear infinite" } : {}} />
                            {status.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={9} />{relTime(audit.createdAt)}</span>
                        </div>
                      </div>
                      
                      <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Plan & Usage Card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>Plan & Usage</h3>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--primary-faint)", color: "var(--primary)", fontFamily: "'Satoshi', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>
                {subscription?.plan || "FREE"}
              </span>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", flexWrap: "wrap", gap: 4 }}>
                <span>Audits this month</span>
                <span style={{ color: "var(--text-primary)" }}>{stats?.currentMonthAudits || 0}{subscription?.plan === "FREE" && <span style={{ color: "var(--text-muted)" }}> / 3</span>}</span>
              </div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${subscription?.plan === "FREE" ? ((stats?.currentMonthAudits || 0) / 3) * 100 : Math.min(((stats?.currentMonthAudits || 0) / 100) * 100, 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }} />
              </div>
            </div>
            
            {subscription?.plan === "FREE" && stats?.remainingAudits !== null && (
              <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--elevated)", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>Remaining free audits</span>
                  <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{stats?.remainingAudits}</span>
                </div>
              </div>
            )}
            
            {subscription?.plan === "FREE" ? (
              <Link href="/pricing" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 16px", background: "var(--primary)", color: "#fff", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                <Zap size={12} /> Upgrade for more audits
              </Link>
            ) : (
              <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", fontFamily: "'Satoshi', sans-serif" }}>
                Renews on {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 18 }}>
            <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: Shield, label: "New Security Audit", href: "/dashboard/scan" },
                { icon: Eye, label: "View Audit History", href: "/dashboard/history" },
                { icon: Star, label: "Upgrade Plan", href: "/pricing" },
              ].map(({ icon: Icon, label, href }) => (
                <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontSize: "clamp(11px, 3vw, 12px)", textDecoration: "none", transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--elevated)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <Icon size={14} style={{ color: "var(--primary)" }} />
                  <span style={{ fontFamily: "'Satoshi', sans-serif" }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Security Tip */}
          <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(99,102,241,0.02) 100%)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius-md)", padding: 16 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Shield size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <div>
                <h4 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 4 }}>Security Tip</h4>
                <p style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", lineHeight: 1.5, fontFamily: "'Satoshi', sans-serif" }}>Regular audits are crucial for contract security. Run audits after every major update.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}