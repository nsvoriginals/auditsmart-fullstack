"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Send, CheckCircle } from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "'Satoshi', sans-serif", fontSize: 13,
  outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate request — wire up to your reset API route when ready
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 36 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={15} style={{ color: "var(--brand)" }} />
          </div>
          <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
            Audit<span style={{ color: "var(--brand)" }}>Smart</span>
          </span>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
          {submitted ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <CheckCircle size={40} style={{ color: "var(--brand)" }} />
              </div>
              <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", marginBottom: 8 }}>
                Check your inbox
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
                If <strong style={{ color: "var(--text-primary)" }}>{email}</strong> is registered, you&apos;ll receive a password reset link within a few minutes.
              </p>
              <Link href="/login" style={{ fontSize: 13, color: "var(--brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={13} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", marginBottom: 6 }}>
                Reset your password
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
                Enter your account email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
                    onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px 0", borderRadius: "var(--radius)",
                    background: loading ? "var(--brand-faint)" : "var(--brand)",
                    color: loading ? "var(--brand)" : "#fff",
                    fontFamily: "'Satoshi', sans-serif", fontWeight: 600, fontSize: 13,
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    transition: "opacity 0.15s",
                    width: "100%",
                  }}
                >
                  <Send size={14} />
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: "center" }}>
                <Link href="/login" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ArrowLeft size={12} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
