"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, ExternalLink, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

export interface TeamRow {
  id:                   string;
  name:                 string;
  code:                 string;
  commissionRate:       number;
  contactEmail:         string | null;
  payoutDetails:        string | null;
  isActive:             boolean;
  clickCount:           number;
  signupCount:          number;
  createdAt:            string;
  qualifyingCount:      number;
  totalCommissionPaise: number;
}

const fmtINR = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TeamsListClient({
  initialTeams, baseUrl,
}: { initialTeams: TeamRow[]; baseUrl: string }) {
  const [teams, setTeams]     = useState(initialTeams);
  const [copiedId, setCopied] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const copyLink = async (team: TeamRow) => {
    const url = `${baseUrl}/r/${team.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(team.id);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard rejected */ }
  };

  const toggleActive = async (team: TeamRow) => {
    if (toggling) return;
    setToggling(team.id);
    const next = !team.isActive;
    // Optimistic update
    setTeams(ts => ts.map(t => t.id === team.id ? { ...t, isActive: next } : t));
    try {
      const r = await fetch(`/api/admin/teams/${team.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: next }),
      });
      if (!r.ok) throw new Error(await r.text());
    } catch {
      // Roll back
      setTeams(ts => ts.map(t => t.id === team.id ? { ...t, isActive: !next } : t));
    } finally {
      setToggling(null);
    }
  };

  const totalEarned = teams.reduce((s, t) => s + t.totalCommissionPaise, 0);
  const totalQuals  = teams.reduce((s, t) => s + t.qualifyingCount,      0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Teams
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Marketing &amp; branding partners. Each gets one referral code, earns commission on referred users&apos; first paid upgrade.
          </p>
        </div>
        <Link href="/admin/teams/new" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 16px", borderRadius: 9,
          background: "var(--brand)", color: "#fff",
          fontSize: 13, fontWeight: 600,
          textDecoration: "none",
        }}>
          <Plus size={14} /> New Team
        </Link>
      </div>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
        <StatTile label="Teams"            value={teams.length.toString()} />
        <StatTile label="Active"           value={teams.filter(t => t.isActive).length.toString()} />
        <StatTile label="Total Qualifying" value={totalQuals.toString()} />
        <StatTile label="Total Owed"       value={fmtINR(totalEarned)} highlight />
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {teams.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No teams yet. <Link href="/admin/teams/new" style={{ color: "var(--brand)" }}>Create the first one →</Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}>
                  <Th>Team</Th>
                  <Th>Code</Th>
                  <Th align="right">Rate</Th>
                  <Th align="right">Clicks</Th>
                  <Th align="right">Signups</Th>
                  <Th align="right">Quals</Th>
                  <Th align="right">Owed</Th>
                  <Th align="center">Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const last = i === teams.length - 1;
                  const shareUrl = `${baseUrl}/r/${t.code}`;
                  return (
                    <tr key={t.id} style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}>
                      <Td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
                        {t.contactEmail && (
                          <div style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 2 }}>{t.contactEmail}</div>
                        )}
                      </Td>
                      <Td>
                        <code style={{
                          padding: "2px 6px", borderRadius: 5,
                          background: "var(--elevated)", border: "1px solid var(--border)",
                          fontFamily: "monospace", fontSize: 11, color: "var(--text-primary)",
                        }}>
                          {t.code}
                        </code>
                      </Td>
                      <Td align="right" mono>{(t.commissionRate * 100).toFixed(0)}%</Td>
                      <Td align="right" mono>{t.clickCount}</Td>
                      <Td align="right" mono>{t.signupCount}</Td>
                      <Td align="right" mono>{t.qualifyingCount}</Td>
                      <Td align="right" mono>
                        <span style={{ color: t.totalCommissionPaise > 0 ? "#6ee7b7" : "var(--text-disabled)" }}>
                          {fmtINR(t.totalCommissionPaise)}
                        </span>
                      </Td>
                      <Td align="center">
                        <button
                          onClick={() => toggleActive(t)}
                          disabled={toggling === t.id}
                          title={t.isActive ? "Deactivate" : "Activate"}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            color: t.isActive ? "#6ee7b7" : "var(--text-disabled)",
                            opacity: toggling === t.id ? 0.5 : 1,
                          }}
                        >
                          {t.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </Td>
                      <Td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => copyLink(t)}
                            title={shareUrl}
                            style={iconBtnStyle}
                          >
                            {copiedId === t.id ? <Check size={12} style={{ color: "#6ee7b7" }} /> : <Copy size={12} />}
                          </button>
                          <a
                            href={`/r/${t.code}`}
                            target="_blank" rel="noopener noreferrer"
                            title="Open link"
                            style={iconBtnStyle}
                          >
                            <ExternalLink size={12} />
                          </a>
                          <Link href={`/admin/teams/${t.id}`} title="Edit" style={iconBtnStyle}>
                            <Pencil size={12} />
                          </Link>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: highlight ? "rgba(251,191,36,0.04)" : "var(--card)",
      border: `1px solid ${highlight ? "rgba(251,191,36,0.20)" : "var(--border)"}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-disabled)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: align ?? "left",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "var(--text-disabled)",
    }}>{children}</th>
  );
}

function Td({ children, align, mono }: { children: React.ReactNode; align?: "left" | "right" | "center"; mono?: boolean }) {
  return (
    <td style={{
      padding: "12px 14px", textAlign: align ?? "left",
      verticalAlign: "middle",
      fontFamily: mono ? "monospace" : undefined,
      color: "var(--text-secondary)",
    }}>{children}</td>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 6,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-secondary)", cursor: "pointer", textDecoration: "none",
};
