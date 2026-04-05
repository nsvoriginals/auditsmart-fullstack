"use client";
// app/(auth)/register/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "var(--elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "'DM Mono', monospace", fontSize: 13,
  outline: "none", transition: "border-color 0.15s",
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error,   setError]           = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const fd       = new FormData(e.currentTarget);
    const name     = fd.get("name")            as string;
    const email    = fd.get("email")           as string;
    const password = fd.get("password")        as string;
    const confirm  = fd.get("confirmPassword") as string;

    if (password !== confirm)  { setError("Passwords do not match.");               setLoading(false); return; }
    if (password.length < 8)   { setError("Password must be at least 8 characters."); setLoading(false); return; }

    const res  = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return; }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard"); router.refresh();
  }

  const ToggleBtn = ({ show, set }: { show: boolean; set: (v: boolean) => void }) => (
    <button type="button" onClick={() => set(!show)}
      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Satoshi', sans-serif" }}>
      {show ? "Hide" : "Show"}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--background)" }} className="bg-grid">
      <div style={{ width: "100%", maxWidth: 440, margin: "auto", padding: "40px 24px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={15} style={{ color: "var(--brand)" }} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: "var(--text-primary)" }}>
            Audit<span style={{ color: "var(--brand)" }}>Smart</span>
          </span>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 28, fontFamily: "'Satoshi', sans-serif" }}>Start your 3 free audits today</p>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 36, boxShadow: "var(--shadow-md)" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Create account</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 22, fontFamily: "'Satoshi', sans-serif" }}>No credit card required</p>

          {error && (
            <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444", fontFamily: "'Satoshi', sans-serif" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'Satoshi', sans-serif" }}>Full name</label>
              <input name="name" type="text" required placeholder="John Doe" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--brand)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'Satoshi', sans-serif" }}>Email address</label>
              <input name="email" type="email" required placeholder="you@example.com" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--brand)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'Satoshi', sans-serif" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input name="password" type={showPass ? "text" : "password"} required placeholder="••••••••" style={{ ...inputStyle, paddingRight: 52 }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
                <ToggleBtn show={showPass} set={setShowPass} />
              </div>
            </div>

            {/* Confirm */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'Satoshi', sans-serif" }}>Confirm password</label>
              <div style={{ position: "relative" }}>
                <input name="confirmPassword" type={showConfirm ? "text" : "password"} required placeholder="••••••••" style={{ ...inputStyle, paddingRight: 52 }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
                <ToggleBtn show={showConfirm} set={setShowConfirm} />
              </div>
              <p style={{ fontSize: 10, color: "var(--text-disabled)", marginTop: 5, fontFamily: "'Satoshi', sans-serif" }}>Minimum 8 characters</p>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: 12, background: loading ? "var(--elevated)" : "var(--brand)", color: loading ? "var(--text-disabled)" : "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {loading
                ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                : "Create account"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, fontSize: 10, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Satoshi', sans-serif" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />Or continue with<div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[{ label: "GitHub", provider: "github" }, { label: "Google", provider: "google" }].map(({ label, provider }) => (
              <button key={provider} onClick={() => signIn(provider, { callbackUrl: "/dashboard" })}
                style={{ padding: "10px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", fontSize: 13, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                {label}
              </button>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
            Already have an account?{" "}<Link href="/login" style={{ color: "var(--brand)" }}>Sign in</Link>
          </p>

          <div style={{ marginTop: 18, padding: "12px 14px", background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: "var(--radius)", fontSize: 11, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.7, fontFamily: "'Satoshi', sans-serif" }}>
            Free plan includes 3 audits per month. No credit card required.
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}