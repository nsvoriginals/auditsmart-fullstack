"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  User, Mail, Lock, Shield, Bell, LogOut,
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
} from "lucide-react";

interface Props {
  initialName: string;
  initialEmail: string;
}

type Section = "profile" | "security" | "notifications";

export default function SettingsClient({ initialName, initialEmail }: Props) {
  const { update } = useSession();
  const [activeSection, setActiveSection] = useState<Section>("profile");

  // Profile
  const [name, setName]       = useState(initialName);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Security
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [pwSaving, setPwSaving]     = useState(false);

  // Notifications
  const [emailAlerts, setEmailAlerts]     = useState(true);
  const [auditComplete, setAuditComplete] = useState(true);
  const [weeklyReport, setWeeklyReport]   = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const saveProfile = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to save");
      await update({ name: name.trim() });
      showToast("success", "Profile updated successfully.");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw) return showToast("error", "Fill in all password fields.");
    if (newPw.length < 8) return showToast("error", "New password must be at least 8 characters.");
    if (newPw !== confirmPw) return showToast("error", "Passwords do not match.");
    setPwSaving(true);
    try {
      const r = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to update password");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showToast("success", "Password changed successfully.");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  const nav: { id: Section; icon: React.ElementType; label: string }[] = [
    { id: "profile",       icon: User,  label: "Profile"       },
    { id: "security",      icon: Lock,  label: "Security"      },
    { id: "notifications", icon: Bell,  label: "Notifications" },
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", fontFamily: "'Satoshi', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 18px", borderRadius: 12,
          background: toast.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.type === "success" ? "#6ee7b7" : "#fca5a5",
          fontSize: 13, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)", maxWidth: 320,
        }}>
          {toast.type === "success"
            ? <CheckCircle size={15} style={{ flexShrink: 0 }} />
            : <AlertCircle size={15} style={{ flexShrink: 0 }} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 6 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Manage your account preferences and security settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>

        {/* Sidebar nav */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          {nav.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", background: activeSection === id ? "rgba(99,102,241,0.08)" : "none",
                border: "none", borderLeft: activeSection === id ? "2px solid #6366f1" : "2px solid transparent",
                color: activeSection === id ? "#a5b4fc" : "var(--text-muted)",
                fontSize: 13, fontWeight: activeSection === id ? 600 : 500,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          <div style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", background: "none", border: "none",
                color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer",
                borderRadius: 8, textAlign: "left", transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>

        {/* Content panels */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>

          {activeSection === "profile" && (
            <div>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <User size={16} style={{ color: "#6366f1" }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Profile Information</h2>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-disabled)", marginBottom: 8 }}>
                    Display Name
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "var(--elevated)", border: "1px solid var(--border)",
                      borderRadius: 8, color: "var(--text-primary)",
                      fontSize: 13, outline: "none", fontFamily: "inherit",
                      transition: "border-color 0.15s", boxSizing: "border-box",
                    }}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = "#6366f1"; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-disabled)", marginBottom: 8 }}>
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-disabled)" }} />
                    <input
                      value={initialEmail}
                      disabled
                      style={{
                        width: "100%", padding: "10px 14px 10px 36px",
                        background: "var(--elevated)", border: "1px solid var(--border)",
                        borderRadius: 8, color: "var(--text-disabled)",
                        fontSize: 13, outline: "none", fontFamily: "inherit",
                        opacity: 0.7, boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <p style={{ marginTop: 6, fontSize: 11, color: "var(--text-disabled)" }}>Email cannot be changed.</p>
                </div>
                <button
                  onClick={saveProfile}
                  disabled={saving || !name.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", background: saving ? "rgba(99,102,241,0.5)" : "#6366f1",
                    color: "#fff", border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={16} style={{ color: "#8b5cf6" }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Security</h2>
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Change Password</h3>
                {[
                  { label: "Current Password", val: currentPw, set: setCurrentPw },
                  { label: "New Password",     val: newPw,     set: setNewPw     },
                  { label: "Confirm Password", val: confirmPw, set: setConfirmPw },
                ].map(({ label, val, set }) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-disabled)", marginBottom: 8 }}>
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={val}
                        onChange={e => set(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 40px 10px 14px",
                          background: "var(--elevated)", border: "1px solid var(--border)",
                          borderRadius: 8, color: "var(--text-primary)",
                          fontSize: 13, outline: "none", fontFamily: "inherit",
                          transition: "border-color 0.15s", boxSizing: "border-box",
                        }}
                        onFocus={e => { (e.target as HTMLElement).style.borderColor = "#8b5cf6"; }}
                        onBlur={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        style={{
                          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: "var(--text-disabled)", padding: 0,
                        }}
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={savePassword}
                  disabled={pwSaving}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", background: pwSaving ? "rgba(139,92,246,0.5)" : "#8b5cf6",
                    color: "#fff", border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: pwSaving ? "not-allowed" : "pointer",
                    marginTop: 8,
                  }}
                >
                  {pwSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Lock size={14} />}
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <Bell size={16} style={{ color: "#f59e0b" }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Notifications</h2>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Email Alerts",     sub: "Receive important account notifications via email", val: emailAlerts, set: setEmailAlerts },
                  { label: "Audit Complete",   sub: "Get notified when your audit finishes",             val: auditComplete, set: setAuditComplete },
                  { label: "Weekly Report",    sub: "Receive a weekly summary of your audits",            val: weeklyReport, set: setWeeklyReport },
                ].map(({ label, sub, val, set }, i, arr) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>
                    </div>
                    <button
                      onClick={() => set(v => !v)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: "none",
                        background: val ? "#6366f1" : "var(--elevated)",
                        cursor: "pointer", transition: "background 0.2s", position: "relative", flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, left: val ? 22 : 3,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#fff", transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => showToast("success", "Notification preferences saved.")}
                  style={{
                    alignSelf: "flex-start", marginTop: 20,
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", background: "#6366f1",
                    color: "#fff", border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <CheckCircle size={14} /> Save Preferences
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .settings-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
