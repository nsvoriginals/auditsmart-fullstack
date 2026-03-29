"use client";
// src/app/dashboard/monitor/page.tsx — Contract Monitor

import React, { useState, useEffect, useRef } from "react";
import { Toast } from "@/components/ui";

interface MonitorEvent {
  id:        string;
  type:      "transaction" | "event" | "alert" | "upgrade";
  severity:  "info" | "warning" | "critical";
  message:   string;
  timestamp: string;
  txHash?:   string;
  blockNum?: number;
}

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  info:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  warning:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  critical: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

const SEVERITY_COLOR: Record<string, string> = {
  info: "#60a5fa", warning: "#facc15", critical: "#f87171",
};

// ── Fake event generator for demo ────────────────────────────────────────────
function generateFakeEvent(): MonitorEvent {
  const types: MonitorEvent["type"][] = ["transaction","event","alert","upgrade"];
  const sevs: MonitorEvent["severity"][] = ["info","info","info","warning","critical"];
  const messages = [
    "Large ETH transfer detected: 50 ETH",
    "Suspicious reentrancy pattern in call trace",
    "Ownership transfer event emitted",
    "Proxy implementation upgraded",
    "Flash loan interaction detected",
    "Contract balance decreased by >10%",
    "New approved spender: 0xdEAD...cafe",
    "Pause function called by 0x1234...5678",
    "Oracle price deviation > 5%",
    "Gas limit anomaly in transaction",
  ];
  const sev  = sevs[Math.floor(Math.random() * sevs.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    id:        Math.random().toString(36).slice(2),
    type, severity: sev,
    message:   messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date().toISOString(),
    txHash:    `0x${Math.random().toString(16).slice(2).padEnd(64,"0")}`,
    blockNum:  Math.floor(19000000 + Math.random() * 100000),
  };
}

export default function MonitorPage() {
  const [address, setAddress]   = useState("");
  const [chain, setChain]       = useState("ethereum");
  const [active, setActive]     = useState(false);
  const [events, setEvents]     = useState<MonitorEvent[]>([]);
  const [toast, setToast]       = useState<{ msg: string; type: "success"|"error"|"info" }|null>(null);
  const [alertCount, setAlertCount] = useState({ total: 0, critical: 0, warning: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const feedRef     = useRef<HTMLDivElement>(null);

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(address.trim());

  const startMonitor = () => {
    if (!isValidAddress) { setToast({ msg: "Enter a valid EVM contract address (0x…)", type: "error" }); return; }
    setEvents([]);
    setAlertCount({ total: 0, critical: 0, warning: 0 });
    setActive(true);
    setToast({ msg: `Monitoring ${address.slice(0,6)}…${address.slice(-4)} on ${chain}`, type: "success" });
  };

  const stopMonitor = () => {
    setActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setToast({ msg: "Monitoring stopped", type: "info" });
  };

  useEffect(() => {
    if (!active) return;

    // Seed a couple immediate events
    const seed = [generateFakeEvent(), generateFakeEvent()];
    setEvents(seed);

    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.35) {   // ~65% chance each tick
        const ev = generateFakeEvent();
        setEvents(prev => [ev, ...prev].slice(0, 100));
        setAlertCount(c => ({
          total:    c.total + 1,
          critical: c.critical + (ev.severity === "critical" ? 1 : 0),
          warning:  c.warning  + (ev.severity === "warning"  ? 1 : 0),
        }));
      }
    }, 2800);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current && events.length > 0) {
      feedRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-1" style={{ color: "var(--frost)" }}>Contract Monitor</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Enter any deployed contract address to watch for suspicious activity in real time.
        </p>
      </div>

      {/* Input card */}
      <div className="card p-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="label">Contract Address</label>
            <input
              className="input input-mono"
              placeholder="0x742d35Cc6634C0532925a3b8D4C9C5f2..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              disabled={active}
            />
          </div>
          <div>
            <label className="label">Network</label>
            <select className="input" value={chain} onChange={e => setChain(e.target.value)} disabled={active}
              style={{ appearance: "none" }}>
              {["ethereum","polygon","arbitrum","optimism","bsc","base"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!active ? (
            <button onClick={startMonitor} className="btn btn-primary btn-md" style={{ minWidth: 160 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              Start Monitoring
            </button>
          ) : (
            <button onClick={stopMonitor} className="btn btn-danger btn-md" style={{ minWidth: 160 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" fill="currentColor"/>
              </svg>
              Stop Monitoring
            </button>
          )}
          {active && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#4ade80" }}>
              <span className="w-2 h-2 rounded-full bg-green-500" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
              Live · {chain.charAt(0).toUpperCase()+chain.slice(1)}
            </div>
          )}
        </div>
      </div>

      {/* Stats row — only when active */}
      {(active || events.length > 0) && (
        <div className="grid grid-cols-3 gap-4 animate-scale-in">
          {[
            { label: "Events Captured", value: alertCount.total, color: "var(--frost)" },
            { label: "Warnings",        value: alertCount.warning, color: "#facc15" },
            { label: "Critical Alerts", value: alertCount.critical, color: "#f87171" },
          ].map(s => (
            <div key={s.label} className="stat-card text-center">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ fontSize: "1.75rem", color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live feed */}
      {events.length > 0 && (
        <div className="card overflow-hidden animate-scale-in">
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="section-title mb-0">Live Feed</h3>
            <div className="flex items-center gap-2">
              {active && <span className="text-xs font-mono" style={{ color: "#4ade80" }}>● LIVE</span>}
              <button onClick={() => setEvents([])} className="btn btn-ghost btn-sm" style={{ fontSize: "0.75rem" }}>Clear</button>
            </div>
          </div>

          <div ref={feedRef} className="scroll-y" style={{ maxHeight: 480 }}>
            {events.map((ev) => (
              <div key={ev.id}
                className="flex items-start gap-4 px-6 py-3.5 border-b transition-colors animate-fade-in"
                style={{ borderColor: "var(--border)", borderLeft: `3px solid ${SEVERITY_COLOR[ev.severity]}` }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="mt-0.5 flex-shrink-0">{SEVERITY_ICON[ev.severity]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: SEVERITY_COLOR[ev.severity] }}>
                      {ev.severity}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      · {ev.type} · block {ev.blockNum?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{ev.message}</p>
                  {ev.txHash && (
                    <p className="text-xs mt-1 font-mono truncate" style={{ color: "var(--text-muted)" }}>
                      tx: {ev.txHash}
                    </p>
                  )}
                </div>
                <time className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!active && events.length === 0 && (
        <div className="card py-16 text-center">
          <div className="feature-icon mx-auto mb-4 w-12 h-12">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p className="text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Paste an address to begin monitoring
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Real-time alerts for large transfers, ownership changes, and exploit patterns.
          </p>
        </div>
      )}
    </div>
  );
}