"use client";
// components/sections/home/dashboard-preview.tsx
// For authenticated users: shows their REAL most recent audit.
// For visitors: shows a "Start your first audit" prompt.

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/use-session";
import { motion } from "framer-motion";
import { ease, dur } from "@/components/motion/config";
import { Reveal } from "@/components/motion/primitives";
import {
  ArrowRight, ShieldAlert, AlertTriangle, Info,
  CheckCircle2, TrendingUp, Cpu, Clock, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

interface Finding {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  lineNumber?: number | null;
  agentType: string;
  description?: string | null;
}

interface RecentAudit {
  id: string;
  contractName: string;
  chain: string;
  status: string;
  score: number | null;
  createdAt: string;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  totalFindings?: number;
}

interface DashboardStats {
  stats: {
    totalAudits: number;
    completedAudits: number;
    averageScore: number;
    currentMonthAudits: number;
  };
  recentAudits: RecentAudit[];
}

// ── Data fetching hooks ───────────────────────────────────────────────────

function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

function useAuditFindings(auditId: string | undefined) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auditId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/audit/report/${auditId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { if (!cancelled) { setFindings(d.findings ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auditId]);

  return { findings, loading };
}

// ── Config ────────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  CRITICAL: { color: "#ff3d2e", bg: "#ff3d2e15", icon: ShieldAlert,    label: "Critical" },
  HIGH:     { color: "#f59e0b", bg: "#f59e0b15", icon: AlertTriangle,  label: "High"     },
  MEDIUM:   { color: "#00d4ff", bg: "#00d4ff12", icon: Info,           label: "Medium"   },
  LOW:      { color: "#00ff88", bg: "#00ff8812", icon: CheckCircle2,   label: "Low"      },
  INFO:     { color: "#888",    bg: "#88888812", icon: Info,           label: "Info"     },
};

function severityOrder(s: string) {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }[s] ?? 5;
}

// ── Components ────────────────────────────────────────────────────────────

export function DashboardPreview() {
  const { data: session, status: authStatus } = useSession();
  const isAuthed = !!session?.user;

  return (
    <section className="relative py-32 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(0,212,255,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-8">
          <div>
            <Reveal>
              <span
                className="text-xs font-semibold tracking-widest uppercase mb-4 block"
                style={{ color: "#00d4ff", fontFamily: "var(--font-dm-mono)" }}
              >
                {isAuthed ? "Your Latest Audit" : "Product"}
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                className="text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
              >
                {isAuthed ? "REAL-TIME AUDIT\nRESULTS" : "AUDIT DASHBOARD\nBUILT FOR ENGINEERS"}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <Link
              href={isAuthed ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-all duration-300 hover:bg-white/5"
              style={{ borderColor: "rgba(0,212,255,0.25)", color: "var(--brand)" }}
            >
              {isAuthed ? "Open Dashboard" : "Start Free Audit"}{" "}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>

        {authStatus === "loading" && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        )}

        {authStatus !== "loading" && (
          isAuthed
            ? <AuthenticatedPreview />
            : <AnonymousPreview />
        )}
      </div>
    </section>
  );
}

// ── Authenticated: real data from API ─────────────────────────────────────

function AuthenticatedPreview() {
  const { data, loading: isLoading, error: isError } = useDashboardStats();
  const mostRecent = data?.recentAudits?.[0];
  const { findings, loading: findingsLoading } = useAuditFindings(mostRecent?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3" style={{ color: "var(--text-muted)" }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your audits…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Could not load audit data.
        </p>
        <Link href="/dashboard" className="text-sm" style={{ color: "var(--brand)" }}>
          Go to Dashboard →
        </Link>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <Reveal>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "rgba(0,212,255,0.15)",
          background: "var(--surface-1)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(0,212,255,0.06)",
        }}
      >
        {/* Browser chrome */}
        <BrowserChrome />

        {/* Dashboard layout */}
        <div className="flex min-h-[480px]">
          <SidebarMock activeItem="Audits" />

          <div className="flex-1 p-6 overflow-hidden">
            {/* Real stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Audits"    value={stats.totalAudits}    sub=""     color="#00d4ff" icon={TrendingUp} />
              <StatCard label="Completed"       value={stats.completedAudits} sub=""    color="#00ff88" icon={CheckCircle2} />
              <StatCard label="This Month"      value={stats.currentMonthAudits} sub="" color="#a855f7" icon={Cpu} />
              <StatCard
                label="Avg Risk Score"
                value={Math.round(stats.averageScore)}
                sub="/ 100"
                color={stats.averageScore >= 70 ? "#ff3d2e" : stats.averageScore >= 40 ? "#f59e0b" : "#00ff88"}
                icon={ShieldAlert}
              />
            </div>

            {/* Most recent audit findings */}
            {mostRecent ? (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {mostRecent.contractName}
                    </span>
                    <StatusBadge status={mostRecent.status} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}>
                    {new Date(mostRecent.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {findingsLoading && (
                  <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--text-muted)" }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading findings…</span>
                  </div>
                )}

                {!findingsLoading && findings && findings.length > 0 && (
                  <>
                    {[...findings]
                      .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
                      .slice(0, 6)
                      .map((f, i) => (
                        <FindingRow key={f.id} finding={f} index={i} />
                      ))
                    }
                    {findings.length > 6 && (
                      <div
                        className="px-4 py-3 text-xs text-center"
                        style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
                      >
                        +{findings.length - 6} more findings —{" "}
                        <Link href={`/dashboard/audit/results/${mostRecent.id}`} style={{ color: "var(--brand)" }}>
                          view all
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {!findingsLoading && (!findings || findings.length === 0) && (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#00ff88" }} />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      No findings in this audit
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <NoAuditsYet />
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ── Anonymous: feature showcase (no fake data) ────────────────────────────

function AnonymousPreview() {
  return (
    <Reveal>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "rgba(0,212,255,0.15)",
          background: "var(--surface-1)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(0,212,255,0.06)",
        }}
      >
        <BrowserChrome />
        <div className="flex min-h-[420px]">
          <SidebarMock activeItem="Findings" />
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.15))",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              <ShieldAlert className="w-9 h-9" style={{ color: "#00d4ff" }} />
            </div>
            <div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
              >
                Your findings will appear here
              </h3>
              <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
                Upload a Solidity contract and get real findings from Slither, Semgrep, AST analysis,
                and 10 AI agents — all in under 60 seconds.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #00d4ff, #7b2fff)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(0,212,255,0.2)",
              }}
            >
              Start Free Audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function BrowserChrome() {
  return (
    <div
      className="flex items-center gap-2 px-5 py-3 border-b"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f56" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#27c93f" }} />
      </div>
      <div
        className="ml-4 flex-1 max-w-[300px] h-6 rounded text-xs flex items-center px-3"
        style={{ background: "var(--surface-1)", color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
      >
        auditsmart.io/dashboard
      </div>
    </div>
  );
}

function SidebarMock({ activeItem }: { activeItem: string }) {
  const items = ["Overview", "Audits", "Findings", "Reports", "Settings"];
  return (
    <div
      className="hidden lg:flex flex-col gap-1 w-52 p-4 flex-shrink-0 border-r"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {items.map((item) => (
        <div
          key={item}
          className="px-3 py-2 rounded-lg text-xs font-medium"
          style={{
            background: item === activeItem ? "rgba(0,212,255,0.08)" : "transparent",
            color: item === activeItem ? "var(--brand)" : "var(--text-muted)",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: number; sub: string; color: string; icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-2xl font-black"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
        >
          {value}
        </span>
        {sub && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}

function FindingRow({ finding, index }: { finding: Finding; index: number }) {
  const cfg = SEV_CONFIG[finding.severity] ?? SEV_CONFIG.INFO;
  const Icon = cfg.icon;

  return (
    <motion.div
      className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
      style={{ borderColor: "var(--border)" }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur.fast, ease: ease.expo, delay: index * 0.05 }}
    >
      <div
        className="flex items-center gap-1.5 min-w-[90px] px-2 py-1 rounded-lg flex-shrink-0"
        style={{ background: cfg.bg }}
      >
        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
        <span
          className="text-[10px] font-bold"
          style={{ color: cfg.color, fontFamily: "var(--font-dm-mono)" }}
        >
          {finding.severity}
        </span>
      </div>

      <span className="flex-1 text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
        {finding.title}
      </span>

      {finding.lineNumber && (
        <span
          className="hidden lg:block text-[10px] flex-shrink-0"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
        >
          :L{finding.lineNumber}
        </span>
      )}

      <span
        className="text-[10px] px-2 py-0.5 rounded flex-shrink-0"
        style={{
          background: "var(--surface-1)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
      >
        {finding.agentType?.replace(/_AGENT$/, "") ?? "AI"}
      </span>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "#00ff88",
    DETERMINISTIC_COMPLETE: "#00d4ff",
    PROCESSING: "#f59e0b",
    FAILED: "#ff3d2e",
    PENDING: "#888",
  };
  const color = colors[status] ?? "#888";
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
      style={{ background: color + "18", color }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function NoAuditsYet() {
  return (
    <div
      className="rounded-xl border flex flex-col items-center justify-center py-16 gap-4 text-center"
      style={{ borderColor: "var(--border)" }}
    >
      <Clock className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        No audits yet. Run your first scan to see results here.
      </p>
      <Link
        href="/dashboard/scan"
        className="inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "var(--brand)" }}
      >
        Start scanning <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
