"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Row {
  teamId: string;
  name: string;
  code: string;
  commissionRate: number;
  contactEmail: string | null;
  payoutDetails: string | null;
  clickCount: number;
  signupCount: number;
  qualifyingCount: number;
  totalCommissionPaise: number;
}

const fmtINR = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function monthsBack(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

const MONTH_OPTIONS = monthsBack(12);

export default function PayoutsClient({
  initialMonth, initialRows,
}: { initialMonth: string; initialRows: Row[] }) {
  const [month, setMonth] = useState(initialMonth);
  const [rows,  setRows]  = useState<Row[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function load(next: string) {
    setMonth(next);
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/payouts?month=${next}`, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load report");
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const header = ["Team", "Code", "Rate", "Clicks", "Signups", "Qualifying", "TotalCommissionINR", "ContactEmail", "PayoutDetails"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        csv(r.name), csv(r.code), r.commissionRate,
        r.clickCount, r.signupCount, r.qualifyingCount,
        (r.totalCommissionPaise / 100).toFixed(2),
        csv(r.contactEmail ?? ""), csv(r.payoutDetails ?? ""),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `payouts-${month}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const totalQuals = rows.reduce((s, r) => s + r.qualifyingCount, 0);
  const totalOwed  = rows.reduce((s, r) => s + r.totalCommissionPaise, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Payouts</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Per-team commissions earned in the selected month. Use this to send out payouts.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={month}
            onChange={e => load(e.target.value)}
            disabled={loading}
            style={{
              padding: "8px 12px", borderRadius: 8,
              background: "var(--elevated)", border: "1px solid var(--border)",
              color: "var(--text-primary)", fontSize: 13, fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={downloadCsv} disabled={rows.length === 0} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: "var(--elevated)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
            cursor: rows.length === 0 ? "not-allowed" : "pointer",
            opacity: rows.length === 0 ? 0.5 : 1,
          }}>
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* Top totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
        <Stat label="Month"             value={month} />
        <Stat label="Teams Earning"     value={rows.filter(r => r.qualifyingCount > 0).length.toString()} />
        <Stat label="Qualifying Events" value={totalQuals.toString()} />
        <Stat label="Total to Pay Out"  value={fmtINR(totalOwed)} highlight />
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)", fontSize: 12, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--brand)" }} />
          </div>
        )}
        {rows.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No teams set up yet. Create one under Teams → New Team.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}>
                  <Th>Team</Th>
                  <Th>Code</Th>
                  <Th align="right">Rate</Th>
                  <Th align="right">Qualifying</Th>
                  <Th align="right">Owed</Th>
                  <Th>Payout To</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const last = i === rows.length - 1;
                  return (
                    <tr key={r.teamId} style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}>
                      <Td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</div>
                      </Td>
                      <Td>
                        <code style={{ padding: "2px 6px", borderRadius: 5, background: "var(--elevated)", border: "1px solid var(--border)", fontFamily: "monospace", fontSize: 11, color: "var(--text-primary)" }}>{r.code}</code>
                      </Td>
                      <Td align="right" mono>{(r.commissionRate * 100).toFixed(0)}%</Td>
                      <Td align="right" mono>{r.qualifyingCount}</Td>
                      <Td align="right" mono>
                        <span style={{ color: r.totalCommissionPaise > 0 ? "#6ee7b7" : "var(--text-disabled)", fontWeight: 700 }}>
                          {fmtINR(r.totalCommissionPaise)}
                        </span>
                      </Td>
                      <Td>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.contactEmail ?? "—"}</div>
                        {r.payoutDetails && <div style={{ fontSize: 11, color: "var(--text-disabled)", fontFamily: "monospace", marginTop: 2 }}>{r.payoutDetails}</div>}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function csv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: highlight ? "rgba(251,191,36,0.04)" : "var(--card)", border: `1px solid ${highlight ? "rgba(251,191,36,0.20)" : "var(--border)"}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-disabled)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th style={{ padding: "10px 14px", textAlign: align ?? "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-disabled)" }}>{children}</th>;
}

function Td({ children, align, mono }: { children: React.ReactNode; align?: "left" | "right"; mono?: boolean }) {
  return <td style={{ padding: "12px 14px", textAlign: align ?? "left", fontFamily: mono ? "monospace" : undefined, color: "var(--text-secondary)" }}>{children}</td>;
}
