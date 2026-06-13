"use client";

import React, { useEffect, useState } from "react";
import {
  Gift, Copy, Check, Users, ExternalLink, Clock, CheckCircle,
  Wallet, TrendingUp, Loader2, Mail, MessageSquare, Send, Save,
  Sparkles, Trophy,
} from "lucide-react";
import { formatPaiseAsUSD } from "@/lib/currency";

// ── Types (mirror lib/referrals.ts ReferralStats) ───────────────────────────
interface ReferralRow {
  id: string;
  status: "PENDING" | "QUALIFIED" | "REJECTED";
  commissionPaise: number;
  createdAt: string;
  qualifiedAt: string | null;
  referredName: string | null;
  referredEmail: string;
}
interface Stats {
  code: string;
  link: string;
  clickCount: number;
  signupCount: number;
  pendingCount: number;
  qualifiedCount: number;
  totalEarnedPaise: number;
  creditBalancePaise: number;
  payoutMethod: "CREDIT" | "CASH";
  payoutDetails: string | null;
  commissionRate: number;
  referrals: ReferralRow[];
}

// ── Theme — distinct "rewards" palette: emerald + gold ───────────────────────
const EMERALD = "#10b981";
const GOLD = "#f5b945";

const money = (paise: number) => formatPaiseAsUSD(paise);

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: "rgba(234,179,8,0.12)",  text: "#ca8a04", label: "Pending" },
  QUALIFIED: { bg: "rgba(16,185,129,0.12)", text: EMERALD,   label: "Qualified" },
  REJECTED:  { bg: "rgba(107,114,128,0.12)", text: "var(--text-muted)", label: "Rejected" },
};

export default function ReferralsClient() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState(false);

  // Payout form local state
  const [method, setMethod]   = useState<"CREDIT" | "CASH">("CREDIT");
  const [details, setDetails] = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((d: Stats) => {
        setStats(d);
        setMethod(d.payoutMethod);
        setDetails(d.payoutDetails ?? "");
      })
      .catch(() => setError("Could not load your referral data. Please refresh."));
  }, []);

  const copyLink = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — no-op */ }
  };

  const savePayout = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/referrals/payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setStats((s) => (s ? { ...s, payoutMethod: method, payoutDetails: details.trim() || null } : s));
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Share targets
  const shareText = stats
    ? `I'm using AuditSmart to scan smart contracts for vulnerabilities — quantum + AI powered. Sign up with my link:`
    : "";
  const shareLinks = stats
    ? [
        { label: "WhatsApp", icon: MessageSquare, href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${stats.link}`)}` },
        { label: "Telegram", icon: Send,          href: `https://t.me/share/url?url=${encodeURIComponent(stats.link)}&text=${encodeURIComponent(shareText)}` },
        { label: "X",        icon: ExternalLink,  href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(stats.link)}` },
        { label: "Email",    icon: Mail,          href: `mailto:?subject=${encodeURIComponent("Try AuditSmart")}&body=${encodeURIComponent(`${shareText} ${stats.link}`)}` },
      ]
    : [];

  // ── Loading / error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
        <p style={{ color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>{error}</p>
      </div>
    );
  }
  if (!stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: ExternalLink, label: "Link Clicks", value: stats.clickCount.toLocaleString(),     color: "var(--text-secondary)" },
    { icon: Users,        label: "Signups",     value: stats.signupCount.toLocaleString(),    color: "var(--brand)" },
    { icon: Clock,        label: "Pending",     value: stats.pendingCount.toLocaleString(),   color: "#ca8a04" },
    { icon: CheckCircle,  label: "Qualified",   value: stats.qualifiedCount.toLocaleString(), color: EMERALD },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "'Satoshi', sans-serif" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Gift size={22} style={{ color: EMERALD }} />
          <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Refer &amp; Earn
          </h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: EMERALD, border: "1px solid rgba(16,185,129,0.25)" }}>
            {Math.round(stats.commissionRate * 100)}% reward
          </span>
        </div>
        <p style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text-muted)" }}>
          Share your link. When someone you invite upgrades to a paid plan, you earn {Math.round(stats.commissionRate * 100)}% of their first month — as account credit or cash, your choice.
        </p>
      </div>

      {/* ── Hero: referral link + share ── */}
      <div
        style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(245,185,69,0.06))",
          border: "1px solid rgba(16,185,129,0.22)", borderRadius: "var(--radius-md)",
          padding: "clamp(20px,5vw,30px)", boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
          <Sparkles size={15} style={{ color: GOLD }} />
          <span style={{ fontSize: "clamp(11px,2.5vw,12px)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>
            Your referral link
          </span>
        </div>

        {/* Link + copy */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, position: "relative" }}>
          <div
            style={{
              flex: 1, minWidth: 240, display: "flex", alignItems: "center",
              padding: "12px 16px", background: "var(--elevated)",
              border: "1px solid var(--border)", borderRadius: "var(--radius)",
              fontFamily: "'DM Mono', monospace", fontSize: "clamp(12px,3vw,14px)",
              color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}
          >
            {stats.link}
          </div>
          <button
            onClick={copyLink}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "0 20px", minHeight: 46, borderRadius: "var(--radius)", border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#04231a",
              background: copied ? GOLD : EMERALD, transition: "background 0.15s",
            }}
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
          </button>
        </div>

        {/* Share buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, position: "relative" }}>
          {shareLinks.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: "var(--radius)",
                  background: "var(--elevated)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, textDecoration: "none",
                }}
              >
                <Icon size={13} /> {s.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        {STAT_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px 18px", boxShadow: "var(--shadow-card)" }}>
              <Icon size={16} style={{ color: c.color, marginBottom: 10 }} />
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Earnings spotlight ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div style={{ background: "linear-gradient(135deg, rgba(245,185,69,0.08), transparent)", border: "1px solid rgba(245,185,69,0.25)", borderRadius: "var(--radius-md)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Trophy size={16} style={{ color: GOLD }} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>Total Earned</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1 }}>{money(stats.totalEarnedPaise)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Across {stats.qualifiedCount} qualified referral{stats.qualifiedCount === 1 ? "" : "s"}</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), transparent)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "var(--radius-md)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Wallet size={16} style={{ color: EMERALD }} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>Credit Balance</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1 }}>{money(stats.creditBalancePaise)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
            {stats.payoutMethod === "CREDIT" ? "Applied automatically at your next checkout" : "You're set to cash payout — earnings are paid out manually"}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(18px,4vw,24px)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>How it works</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { n: "1", t: "Share your link", d: "Send your unique link to founders, devs, and teams who deploy contracts." },
            { n: "2", t: "They sign up & upgrade", d: "When your invite creates an account and upgrades to a paid plan, the referral qualifies." },
            { n: "3", t: "You get rewarded", d: `You earn ${Math.round(stats.commissionRate * 100)}% of their first month — as account credit or cash.` },
          ].map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 12 }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "rgba(16,185,129,0.12)", color: EMERALD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payout preference ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "clamp(18px,4vw,24px)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Payout method</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>Choose how you'd like to receive your referral earnings. You can change this anytime.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
          {([
            { id: "CREDIT" as const, icon: Wallet, title: "Account Credit", desc: "Earnings stack up as credit and apply automatically to your next subscription payment." },
            { id: "CASH"   as const, icon: TrendingUp, title: "Cash Payout", desc: "Earnings are paid out to your UPI / bank. Requires payout details below." },
          ]).map((opt) => {
            const Icon = opt.icon;
            const active = method === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                style={{
                  textAlign: "left", cursor: "pointer", padding: "16px 18px", borderRadius: "var(--radius)",
                  background: active ? "rgba(16,185,129,0.07)" : "var(--elevated)",
                  border: `1.5px solid ${active ? EMERALD : "var(--border)"}`,
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Icon size={16} style={{ color: active ? EMERALD : "var(--text-muted)" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{opt.title}</span>
                  {active && <Check size={15} style={{ color: EMERALD, marginLeft: "auto" }} />}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {method === "CASH" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Payout details (UPI ID or bank reference)
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. yourname@upi  or  AC: 1234… IFSC: HDFC…"
              style={{
                width: "100%", padding: "10px 12px", background: "var(--elevated)",
                border: "1px solid var(--border)", borderRadius: "var(--radius)",
                color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "'Satoshi', sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = EMERALD)}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={savePayout}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px",
              borderRadius: "var(--radius)", border: "none", cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: 13, color: "#04231a", background: EMERALD, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : "Save preference"}
          </button>
          {saved && <span style={{ fontSize: 13, color: EMERALD, display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> Saved</span>}
          {saveError && <span style={{ fontSize: 13, color: "#ef4444" }}>{saveError}</span>}
        </div>
      </div>

      {/* ── Referral list ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Your referrals</h3>
        </div>
        {stats.referrals.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center" }}>
            <Users size={26} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>No referrals yet</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Share your link above to start earning.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                  {["Referred", "Status", "Reward", "Joined"].map((h) => (
                    <th key={h} style={{ padding: "12px 22px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.referrals.map((r) => {
                  const st = STATUS_STYLE[r.status];
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 22px", color: "var(--text-primary)" }}>
                        {r.referredName || r.referredEmail}
                      </td>
                      <td style={{ padding: "12px 22px" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: st.bg, color: st.text }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "12px 22px", color: r.commissionPaise > 0 ? EMERALD : "var(--text-muted)", fontWeight: r.commissionPaise > 0 ? 600 : 400 }}>
                        {r.commissionPaise > 0 ? money(r.commissionPaise) : "—"}
                      </td>
                      <td style={{ padding: "12px 22px", color: "var(--text-muted)" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
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
