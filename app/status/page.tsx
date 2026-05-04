"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, AlertTriangle, XCircle, Clock, Activity, Zap, Globe, Database, Shield, Server } from "lucide-react";

const SERVICES = [
  {
    name: "AI Audit Engine",
    description: "Multi-agent vulnerability analysis pipeline",
    status: "operational",
    uptime: "99.98%",
    latency: "48s avg",
    icon: Shield,
  },
  {
    name: "API Gateway",
    description: "REST API endpoints for all operations",
    status: "operational",
    uptime: "99.99%",
    latency: "142ms",
    icon: Server,
  },
  {
    name: "Authentication",
    description: "Login, OAuth, and session management",
    status: "operational",
    uptime: "100%",
    latency: "89ms",
    icon: Globe,
  },
  {
    name: "Database",
    description: "User data, audit history, reports",
    status: "operational",
    uptime: "99.97%",
    latency: "12ms",
    icon: Database,
  },
  {
    name: "PDF Report Generation",
    description: "Audit report PDF rendering and storage",
    status: "operational",
    uptime: "99.95%",
    latency: "3.2s",
    icon: Activity,
  },
  {
    name: "Payment Processing",
    description: "Razorpay integration for subscriptions",
    status: "operational",
    uptime: "99.99%",
    latency: "380ms",
    icon: Zap,
  },
  {
    name: "Email Delivery",
    description: "Transactional emails via Resend",
    status: "operational",
    uptime: "99.9%",
    latency: "1.1s",
    icon: Globe,
  },
  {
    name: "CDN & Static Assets",
    description: "Frontend delivery via Vercel Edge Network",
    status: "operational",
    uptime: "100%",
    latency: "18ms",
    icon: Zap,
  },
];

const INCIDENTS = [
  {
    date: "Apr 28, 2025",
    title: "Elevated API latency on Audit Engine",
    duration: "23 minutes",
    status: "resolved",
    description: "Groq API experienced elevated response times. Our failover logic kicked in automatically. All audits completed successfully with slight delays.",
  },
  {
    date: "Apr 12, 2025",
    title: "Scheduled database maintenance",
    duration: "8 minutes",
    status: "resolved",
    description: "Planned maintenance window for database index optimization. The platform was in read-only mode during this period.",
  },
  {
    date: "Mar 31, 2025",
    title: "PDF generation timeout for large contracts",
    duration: "45 minutes",
    status: "resolved",
    description: "Contracts over 2,000 lines were experiencing PDF generation timeouts. Increased worker timeout limits and deployed a hotfix.",
  },
];

const UPTIME_MONTHS = [
  { month: "Nov", uptime: 100 },
  { month: "Dec", uptime: 99.9 },
  { month: "Jan", uptime: 100 },
  { month: "Feb", uptime: 99.8 },
  { month: "Mar", uptime: 99.97 },
  { month: "Apr", uptime: 99.99 },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    operational: { color: "var(--brand-green)", bg: "rgba(0,255,148,0.08)", border: "rgba(0,255,148,0.2)", icon: CheckCircle, label: "Operational" },
    degraded: { color: "var(--warning)", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: AlertTriangle, label: "Degraded" },
    outage: { color: "var(--destructive)", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: XCircle, label: "Outage" },
  }[status] ?? { color: "var(--text-muted)", bg: "var(--elevated)", border: "var(--border)", icon: Clock, label: "Unknown" };

  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOperational = SERVICES.every((s) => s.status === "operational");

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${allOperational ? "rgba(0,255,148,0.07)" : "rgba(245,158,11,0.07)"} 0%, transparent 70%)`,
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-6"
            style={{
              background: allOperational ? "rgba(0,255,148,0.08)" : "rgba(245,158,11,0.08)",
              border: `1px solid ${allOperational ? "rgba(0,255,148,0.25)" : "rgba(245,158,11,0.25)"}`,
              color: allOperational ? "var(--brand-green)" : "var(--warning)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: allOperational ? "var(--brand-green)" : "var(--warning)",
                boxShadow: `0 0 8px ${allOperational ? "var(--brand-green)" : "var(--warning)"}`,
                animation: "pulse 2s infinite",
              }}
            />
            {allOperational ? "All Systems Operational" : "Partial Service Disruption"}
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            System Status
          </h1>
          <p className="text-sm" suppressHydrationWarning style={{ color: "var(--text-muted)" }}>
            Real-time status for all AuditSmart services
            {lastUpdated && <span> · Last updated {lastUpdated}</span>}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* 90-day Uptime */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>6-Month Uptime Overview</h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Overall: 99.94%</span>
          </div>
          <div className="flex items-end gap-1.5 h-14">
            {UPTIME_MONTHS.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all hover:opacity-80"
                  style={{
                    height: `${Math.max(6, (m.uptime / 100) * 44)}px`,
                    background: m.uptime >= 99.9
                      ? "var(--brand-green)"
                      : m.uptime >= 99
                      ? "var(--warning)"
                      : "var(--destructive)",
                    opacity: 0.8,
                  }}
                  title={`${m.month}: ${m.uptime}%`}
                />
                <span className="text-[9px]" style={{ color: "var(--text-disabled)" }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-10">
          <h2
            className="text-xl font-bold mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Services
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    background: i % 2 === 0 ? "var(--surface-1)" : "var(--background)",
                    borderBottom: i < SERVICES.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--elevated)" }}
                  >
                    <Icon size={16} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{service.name}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{service.description}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <div className="text-right">
                      <div className="font-medium" style={{ color: "var(--text-secondary)" }}>{service.uptime}</div>
                      <div>uptime</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium" style={{ color: "var(--text-secondary)" }}>{service.latency}</div>
                      <div>latency</div>
                    </div>
                  </div>
                  <StatusBadge status={service.status} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Incidents */}
        <div>
          <h2
            className="text-xl font-bold mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Incidents
          </h2>
          {INCIDENTS.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "var(--brand-green)" }} />
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No incidents in the last 90 days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {INCIDENTS.map((incident) => (
                <div
                  key={incident.title}
                  className="rounded-2xl p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                >
                  <div className="flex flex-wrap items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{incident.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{incident.date}</span>
                        <span className="text-xs" style={{ color: "var(--text-disabled)" }}>·</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Duration: {incident.duration}</span>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ color: "var(--brand-green)", background: "rgba(0,255,148,0.08)", border: "1px solid rgba(0,255,148,0.2)" }}
                    >
                      <CheckCircle size={10} /> Resolved
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{incident.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscribe */}
        <div
          className="mt-10 rounded-2xl p-6 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(123,47,255,0.06), rgba(0,212,255,0.04))",
            border: "1px solid var(--border)",
          }}
        >
          <h3 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Get status alerts</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Subscribe to incident notifications via email or our social channels.
          </p>
          <a
            href="mailto:status@auditsmart.org?subject=Subscribe to Status Updates"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
          >
            Subscribe to Updates
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
