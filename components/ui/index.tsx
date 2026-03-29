"use client";
// src/components/ui/index.tsx — lightweight shared primitives

import React from "react";

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className}`}
      style={{ color: "inherit" }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
    </svg>
  );
}

// ── SEVERITY BADGE ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "badge-critical",
    high:     "badge-high",
    medium:   "badge-medium",
    low:      "badge-low",
    info:     "badge-info",
  };
  return (
    <span className={`badge ${map[severity.toLowerCase()] ?? "badge-info"}`}>
      {severity.toUpperCase()}
    </span>
  );
}

// ── PLAN BADGE ────────────────────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: string }) {
  const isPaid = plan !== "free";
  return (
    <span className={`badge ${isPaid ? "badge-premium" : "badge-free"}`}>
      {isPaid ? "✦ " : ""}{plan.toUpperCase()}
    </span>
  );
}

// ── COPY BUTTON ───────────────────────────────────────────────────────────────
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn btn-ghost btn-sm" title="Copy">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── SKELETON LOADER ───────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="skeleton h-3 w-1/3 rounded" style={{ background: "var(--bg-hover)" }} />
      <div className="skeleton h-6 w-1/2 rounded" style={{ background: "var(--bg-hover)" }} />
      <div className="skeleton h-3 w-3/4 rounded" style={{ background: "var(--bg-hover)" }} />
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="feature-icon w-14 h-14">{icon}</div>
      <div>
        <p className="text-base font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{title}</p>
        {sub && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── RISK SCORE RING ───────────────────────────────────────────────────────────
export function RiskRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius   = (size - 8) / 2;
  const circ     = 2 * Math.PI * radius;
  const offset   = circ - (score / 100) * circ;
  const color    = score >= 80 ? "#f87171" : score >= 60 ? "#fb923c" : score >= 40 ? "#facc15" : "#4ade80";

  return (
    <div className="risk-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: `${size * 0.22}px`, fontWeight: 500, color }}>{score}</span>
      </div>
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "info", onClose }: {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icon = {
    success: <span style={{ color: "#4ade80" }}>✓</span>,
    error:   <span style={{ color: "#f87171" }}>✕</span>,
    info:    <span style={{ color: "var(--plum-light)" }}>ℹ</span>,
  }[type];

  return (
    <div className={`toast toast-${type}`}>
      {icon}
      <span style={{ color: "var(--text-primary)" }}>{message}</span>
      <button onClick={onClose} style={{ color: "var(--text-muted)", marginLeft: 8 }}>✕</button>
    </div>
  );
}