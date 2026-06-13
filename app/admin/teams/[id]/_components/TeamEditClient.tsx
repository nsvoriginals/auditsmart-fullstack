"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Copy, Check, Loader2 } from "lucide-react";
import { formatPaiseAsUSD } from "@/lib/currency";

interface Team {
  id: string;
  name: string;
  code: string;
  commissionRate: number;
  contactEmail: string | null;
  payoutDetails: string | null;
  isActive: boolean;
  clickCount: number;
  signupCount: number;
  createdAt: string;
}
interface Stats {
  qualifyingCount: number;
  totalCommissionPaise: number;
  totalRevenuePaise: number;
}
interface Commission {
  id: string;
  paymentId: string;
  plan: string;
  paymentAmountPaise: number;
  commissionPaise: number;
  createdAt: string;
  userEmail: string;
  userName: string | null;
}

const fmtUSD = (paise: number) =>
  formatPaiseAsUSD(paise, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TeamEditClient({
  team, stats, recent, baseUrl,
}: { team: Team; stats: Stats; recent: Commission[]; baseUrl: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast,  setToast]  = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const shareUrl = `${baseUrl}/r/${team.code}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      name:           String(fd.get("name") ?? "").trim(),
      commissionRate: Number(fd.get("rate") ?? 0),
      contactEmail:   String(fd.get("email") ?? "").trim() || null,
      payoutDetails:  String(fd.get("payout") ?? "").trim() || null,
      isActive:       fd.get("active") === "on",
    };

    try {
      const r = await fetch(`/api/admin/teams/${team.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Save failed");
      setToast({ type: "ok", msg: "Saved" });
      router.refresh();
    } catch (err) {
      setToast({ type: "err", msg: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 70, right: 24, zIndex: 50,
          padding: "10px 14px", borderRadius: 8,
          background: toast.type === "ok" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.type === "ok" ? "rgba(16,185,129,0.30)" : "rgba(239,68,68,0.30)"}`,
          color: toast.type === "ok" ? "#6ee7b7" : "#fca5a5",
          fontSize: 13, fontWeight: 600,
        }}>{toast.msg}</div>
      )}

      <Link href="/admin/teams" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={13} /> Back to teams
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {team.name}
        </h1>
        {!team.isActive && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Inactive</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
        Code <code style={{ padding: "1px 6px", borderRadius: 4, background: "var(--elevated)", border: "1px solid var(--border)", fontFamily: "monospace" }}>{team.code}</code> · Created {new Date(team.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
      </p>

      {/* Share link */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", minWidth: 80 }}>Share Link</div>
        <input readOnly value={shareUrl} onFocus={e => e.currentTarget.select()} style={{ flex: 1, minWidth: 240, padding: "8px 10px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 7, fontFamily: "monospace", fontSize: 12, color: "var(--text-primary)" }} />
        <button onClick={copy} style={{
          padding: "8px 14px", borderRadius: 7,
          background: copied ? "rgba(16,185,129,0.15)" : "var(--brand)",
          border: copied ? "1px solid rgba(16,185,129,0.30)" : "none",
          color: copied ? "#6ee7b7" : "#fff",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        <Stat label="Clicks"          value={team.clickCount.toString()} />
        <Stat label="Signups"         value={team.signupCount.toString()} />
        <Stat label="Qualifying"      value={stats.qualifyingCount.toString()} />
        <Stat label="Revenue Driven"  value={fmtUSD(stats.totalRevenuePaise)} />
        <Stat label="Total Owed"      value={fmtUSD(stats.totalCommissionPaise)} highlight />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        {/* Edit form */}
        <form onSubmit={onSave} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Settings</h2>

          <Field label="Team name">
            <input name="name" defaultValue={team.name} required maxLength={100} style={inputStyle} />
          </Field>

          <Field label="Commission rate" hint="Decimal between 0 and 1. Affects future commissions only.">
            <input name="rate" type="number" step="0.01" min="0" max="1" defaultValue={team.commissionRate} required style={{ ...inputStyle, fontFamily: "monospace" }} />
          </Field>

          <Field label="Contact email">
            <input name="email" type="email" defaultValue={team.contactEmail ?? ""} maxLength={200} style={inputStyle} />
          </Field>

          <Field label="Payout details">
            <textarea name="payout" defaultValue={team.payoutDetails ?? ""} rows={2} maxLength={400} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
          </Field>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" name="active" defaultChecked={team.isActive} />
            Active (accepts new signups via this code)
          </label>

          <button type="submit" disabled={saving} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 18px", borderRadius: 9,
            background: saving ? "var(--elevated)" : "var(--brand)",
            color: saving ? "var(--text-disabled)" : "#fff",
            border: "none", fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer",
          }}>
            {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        {/* Commission history */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Recent Commissions</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Last 50 qualifying first-paid upgrades.</p>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: "var(--text-disabled)", fontSize: 13 }}>
              No commissions yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}>
                    <Th>User</Th><Th>Plan</Th><Th align="right">Revenue</Th><Th align="right">Commission</Th><Th align="right">When</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i === recent.length - 1 ? "none" : "1px solid var(--border)" }}>
                      <Td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.userName || c.userEmail}</div>
                        {c.userName && <div style={{ fontSize: 10, color: "var(--text-disabled)" }}>{c.userEmail}</div>}
                      </Td>
                      <Td>{c.plan}</Td>
                      <Td align="right" mono>{fmtUSD(c.paymentAmountPaise)}</Td>
                      <Td align="right" mono><span style={{ color: "#6ee7b7" }}>{fmtUSD(c.commissionPaise)}</span></Td>
                      <Td align="right" mono><span suppressHydrationWarning>{new Date(c.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: highlight ? "rgba(251,191,36,0.04)" : "var(--card)", border: `1px solid ${highlight ? "rgba(251,191,36,0.20)" : "var(--border)"}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-disabled)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th style={{ padding: "10px 14px", textAlign: align ?? "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-disabled)" }}>{children}</th>;
}

function Td({ children, align, mono }: { children: React.ReactNode; align?: "left" | "right"; mono?: boolean }) {
  return <td style={{ padding: "10px 14px", textAlign: align ?? "left", fontFamily: mono ? "monospace" : undefined, color: "var(--text-secondary)" }}>{children}</td>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13, outline: "none",
};
