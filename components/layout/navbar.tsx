"use client";
// src/components/layout/Navbar.tsx

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { PlanBadge } from "@/components/ui";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <nav className="nav">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, var(--plum), var(--rose))",
            borderRadius: "var(--radius-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1rem",
            color: "var(--frost)",
            letterSpacing: "-0.02em",
          }}>
            Audit<span style={{ color: "var(--plum-light)" }}>Smart</span>
          </span>
        </Link>

        {/* Center Nav - Landing only */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-6">
            {["Features", "Pricing", "Docs"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--frost)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {item}
              </Link>
            ))}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <PlanBadge plan={session.user.plan ?? "free"} />
              <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Start free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}