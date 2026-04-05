"use client";
// app/(auth)/login/page.tsx

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

/* Shared token-driven styles — no hardcoded #hex for backgrounds */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "'DM Mono', monospace", fontSize: 13,
  outline: "none", transition: "border-color 0.15s",
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 36 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Shield size={15} style={{ color: "var(--brand)" }} />
      </div>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: "var(--text-primary)" }}>
        Audit<span style={{ color: "var(--brand)" }}>Smart</span>
      </span>
    </div>
  );
}

function OAuthGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[
        { label: "GitHub", provider: "github" },
        { label: "Google", provider: "google" },
      ].map(({ label, provider }) => (
        <button key={provider} onClick={() => signIn(provider, { callbackUrl: "/dashboard" })}
          style={{ padding: "10px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", fontSize: 13, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >{label}</button>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid email or password."); setLoading(false); }
    else { router.push("/dashboard"); router.refresh(); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--background)" }} className="bg-grid">
      <div style={{ width: "100%", maxWidth: 420, margin: "auto", padding: "40px 24px" }}>
        <Logo />

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 36, boxShadow: "var(--shadow-md)" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24, fontFamily: "'Satoshi', sans-serif" }}>Sign in to your account to continue</p>

          {error && (
            <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: "Email address", type: "email",    value: email,    set: setEmail,    placeholder: "you@example.com" },
              { label: "Password",      type: "password", value: password, set: setPassword, placeholder: "••••••••" },
            ].map(({ label, type, value, set, placeholder }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'Satoshi', sans-serif" }}>{label}</label>
                <input type={type} required value={value} onChange={e => set(e.target.value)} placeholder={placeholder} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "var(--brand)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
              </div>
            ))}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-muted)", cursor: "pointer", fontFamily: "'Satoshi', sans-serif" }}>
                <input type="checkbox" style={{ accentColor: "var(--brand)" }} /> Remember me
              </label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--brand)", fontFamily: "'Satoshi', sans-serif" }}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: 12, background: loading ? "var(--elevated)" : "var(--brand)", color: loading ? "var(--text-disabled)" : "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {loading
                ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                : <><span>Sign in</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px", fontSize: 10, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Satoshi', sans-serif" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />Or continue with<div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <OAuthGrid />

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 22, fontFamily: "'Satoshi', sans-serif" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--brand)" }}>Sign up</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}