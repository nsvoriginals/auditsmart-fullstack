"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function NewTeamClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name:           String(fd.get("name") ?? "").trim(),
      code:           String(fd.get("code") ?? "").trim().toUpperCase(),
      commissionRate: Number(fd.get("rate") ?? 0.20),
      contactEmail:   String(fd.get("email") ?? "").trim() || null,
      payoutDetails:  String(fd.get("payout") ?? "").trim() || null,
      isActive:       true,
    };

    try {
      const r = await fetch("/api/admin/teams", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to create team");
      router.push(`/admin/teams/${data.team.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin/teams" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, color: "var(--text-muted)",
        textDecoration: "none", marginBottom: 16,
      }}>
        <ArrowLeft size={13} /> Back to teams
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
        New Team
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
        Create a marketing/branding partner. The code becomes their referral link <code>/r/&lt;CODE&gt;</code>.
      </p>

      <form onSubmit={onSubmit} style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 24,
      }}>
        {error && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: 8,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)",
            fontSize: 12, color: "#fca5a5",
          }}>{error}</div>
        )}

        <Field label="Team name" hint="Display name. Not publicly visible.">
          <input
            name="name" required maxLength={100} autoFocus
            placeholder="Team Alpha"
            style={inputStyle}
          />
        </Field>

        <Field label="Referral code" hint="3-32 chars, A-Z 0-9 _ - only. Used in the public link /r/<CODE>. Cannot be changed later.">
          <input
            name="code" required maxLength={32}
            pattern="[A-Za-z0-9_-]{3,32}"
            placeholder="TEAMALPHA"
            style={{ ...inputStyle, fontFamily: "monospace", textTransform: "uppercase" }}
          />
        </Field>

        <Field label="Commission rate" hint="Decimal between 0 and 1. 0.20 = 20% of first paid month.">
          <input
            name="rate" type="number" step="0.01" min="0" max="1"
            defaultValue="0.20" required
            style={{ ...inputStyle, fontFamily: "monospace" }}
          />
        </Field>

        <Field label="Contact email (optional)" hint="Where you'll send the payout each month.">
          <input
            name="email" type="email" maxLength={200}
            placeholder="alpha@partner.com"
            style={inputStyle}
          />
        </Field>

        <Field label="Payout details (optional)" hint="Free-form. UPI ID, bank account ref, PayPal, etc.">
          <textarea
            name="payout" rows={2} maxLength={400}
            placeholder="UPI: alpha@upi"
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
          />
        </Field>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={submitting} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 18px", borderRadius: 9,
            background: submitting ? "var(--elevated)" : "var(--brand)",
            color: submitting ? "var(--text-disabled)" : "#fff",
            border: "none",
            fontSize: 13, fontWeight: 600, cursor: submitting ? "wait" : "pointer",
          }}>
            {submitting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
            {submitting ? "Creating…" : "Create Team"}
          </button>
          <Link href="/admin/teams" style={{
            padding: "10px 18px", borderRadius: 9,
            background: "var(--elevated)", border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            display: "inline-flex", alignItems: "center",
          }}>
            Cancel
          </Link>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 5, lineHeight: 1.4 }}>
          {hint}
        </div>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
};
