"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, CheckCircle, Mail } from "lucide-react";
import toast from "react-hot-toast";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "'Satoshi', sans-serif",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s",
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 36 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={15} style={{ color: "var(--brand)" }} />
        </div>
        <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
          Audit<span style={{ color: "var(--brand)" }}>Smart</span>
        </span>
      </Link>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Satoshi', sans-serif",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(123,47,255,0.10) 0%, transparent 70%)",
        }}
      />

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        <Logo />

        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
          }}
        >
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(0,255,148,0.08)",
                  border: "2px solid rgba(0,255,148,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle size={26} style={{ color: "var(--brand-green)" }} />
              </div>
              <h2
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: "-0.025em",
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                Check your email
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>
                We sent a password reset link to
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
                {email}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6, marginBottom: 24 }}>
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Satoshi', sans-serif", fontSize: 12, fontWeight: 600 }}
                >
                  try again
                </button>
                .
              </p>
              <div
                style={{
                  padding: "12px",
                  background: "var(--elevated)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Mail size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.5 }}>
                  The link expires in 30 minutes. Only the most recently sent link is valid.
                </span>
              </div>
              <Link
                href="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  padding: "11px",
                  background: "var(--elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-secondary)",
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: "-0.025em",
                  color: "var(--text-primary)",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Reset your password
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 1.6,
                  marginBottom: 28,
                }}
              >
                Enter your account email and we&apos;ll send you a secure reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: 6,
                      fontFamily: "'Satoshi', sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: loading ? "var(--elevated)" : "linear-gradient(135deg, var(--brand-purple), var(--brand))",
                    border: "none",
                    borderRadius: "var(--radius)",
                    color: loading ? "var(--text-muted)" : "white",
                    fontFamily: "'Satoshi', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "opacity 0.15s",
                    marginBottom: 20,
                  }}
                >
                  {loading ? "Sending..." : <>Send Reset Link <ArrowRight size={15} /></>}
                </button>
              </form>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ color: "var(--text-disabled)", fontSize: 11, fontFamily: "'Satoshi', sans-serif" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Link
                  href="/login"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--text-muted)",
                    fontFamily: "'Satoshi', sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  Back to Login
                </Link>
                <Link
                  href="/register"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--text-muted)",
                    fontFamily: "'Satoshi', sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  Create Account
                </Link>
              </div>
            </>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 11,
            color: "var(--text-disabled)",
            fontFamily: "'Satoshi', sans-serif",
          }}
        >
          Need more help?{" "}
          <Link href="/support" style={{ color: "var(--brand)", textDecoration: "none" }}>
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
