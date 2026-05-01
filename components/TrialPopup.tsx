"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";

const DISMISSED_KEY = "trial_popup_dismissed";

export function TrialPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/dashboard")) return;
    if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) return;
    if (typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY)) return;

    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [pathname]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleCta = () => {
    dismiss();
    router.push("/pricing?trial=true");
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes trialSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        role="dialog"
        aria-label="Free trial offer"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "var(--card)",
          border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: "var(--radius-lg)",
          padding: "22px 24px 20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.08)",
          maxWidth: 320, width: "calc(100vw - 48px)",
          animation: "trialSlideUp 0.35s ease",
          fontFamily: "'Satoshi', sans-serif",
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: "absolute", top: 10, right: 10,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: 4, borderRadius: 4,
            display: "flex", alignItems: "center",
          }}
        >
          <X size={13} />
        </button>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 100,
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.2)",
          color: "var(--brand)", fontSize: 10,
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 12,
        }}>
          <Zap size={9} /> Limited Offer
        </div>

        <h3 style={{
          fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em",
          color: "var(--text-primary)", marginBottom: 6,
        }}>
          Try AuditSmart Free
        </h3>

        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 6 }}>
          Get <strong style={{ color: "var(--text-primary)" }}>3 days free</strong> on any paid plan.
          Full access, zero charge today.
        </p>

        <div style={{
          fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em",
          color: "var(--text-primary)", lineHeight: 1,
        }}>
          $0.00{" "}
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>for 3 days</span>
        </div>

        <p style={{ fontSize: 11, color: "var(--text-disabled)", margin: "4px 0 16px" }}>
          Then your plan&apos;s regular price. Cancel anytime before day 4.
        </p>

        <button
          onClick={handleCta}
          style={{
            width: "100%", padding: "11px 0",
            background: "var(--brand)", color: "#fff",
            border: "none", borderRadius: "var(--radius)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Try Today for $0.00 →
        </button>
      </div>
    </>
  );
}
