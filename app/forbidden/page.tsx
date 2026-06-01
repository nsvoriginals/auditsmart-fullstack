// app/forbidden/page.tsx — generic 403 page (used by /admin/* layout for
// non-admin redirects).
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Forbidden · AuditSmart" };

export default function ForbiddenPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, background: "var(--background)",
      fontFamily: "'Satoshi', sans-serif",
    }}>
      <div style={{
        maxWidth: 420, textAlign: "center",
        padding: 32, borderRadius: 16,
        background: "var(--card)", border: "1px solid var(--border)",
      }}>
        <div style={{
          width: 56, height: 56, margin: "0 auto 16px",
          borderRadius: 14,
          background: "rgba(239,68,68,0.10)",
          border: "1px solid rgba(239,68,68,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldAlert size={26} style={{ color: "#fca5a5" }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
          403 · Forbidden
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.55 }}>
          You don&apos;t have permission to access this area. This section is reserved for administrators.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Link href="/dashboard" style={{
            padding: "9px 18px", borderRadius: 8,
            background: "var(--brand)", color: "#fff",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            Back to Dashboard
          </Link>
          <Link href="/" style={{
            padding: "9px 18px", borderRadius: 8,
            background: "var(--elevated)", border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
