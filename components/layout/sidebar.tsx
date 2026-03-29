"use client";
// src/components/layout/Sidebar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PlanBadge } from "@/components/ui";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Scan Contract",
    href: "/dashboard/scan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
      </svg>
    ),
  },
  {
    label: "Monitor",
    href: "/dashboard/monitor",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    label: "Audit History",
    href: "/dashboard/history",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="sidebar flex flex-col">
      {/* User info */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, var(--plum), var(--rose))",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.875rem", fontWeight: 600, color: "white",
            flexShrink: 0,
          }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session?.user?.name ?? "User"}
            </p>
            <PlanBadge plan={session?.user?.plan ?? "free"} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        <p className="section-sub px-4 pt-2 pb-1">Navigation</p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item ${active ? "active" : ""}`}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        <div className="divider mx-4" />

        <p className="section-sub px-4 pb-1">Account</p>
        <Link href="/pricing" className="sidebar-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Upgrade Plan
        </Link>
      </nav>

      {/* Quota indicator */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Audits remaining</span>
          <span className="text-xs font-mono font-medium" style={{ color: "var(--text-primary)" }}>
            {session?.user?.free_audits_remaining ?? 0}
          </span>
        </div>
        <div style={{ height: 4, background: "var(--bg-hover)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, ((session?.user?.free_audits_remaining ?? 0) / 20) * 100)}%`,
            background: "linear-gradient(90deg, var(--plum), var(--rose))",
            borderRadius: 2,
            transition: "width 0.5s var(--ease-out)",
          }} />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn btn-ghost btn-sm w-full mt-3"
          style={{ color: "var(--text-muted)", justifyContent: "flex-start", gap: 8 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}