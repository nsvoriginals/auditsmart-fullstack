"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#0c0c0e", color: "#f5f5f7" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ fontSize: "13px", color: "#888", textAlign: "center" }}>
            An unexpected error occurred. Please try again.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={reset}
              style={{ padding: "8px 20px", borderRadius: "8px", background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              style={{ padding: "8px 20px", borderRadius: "8px", background: "transparent", color: "#6366f1", border: "1px solid rgba(99,102,241,0.4)", cursor: "pointer", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
