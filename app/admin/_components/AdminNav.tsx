"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Wallet, LayoutDashboard, LogOut } from "lucide-react";

const ITEMS = [
  { label: "Teams",   href: "/admin/teams",   icon: Users   },
  { label: "Payouts", href: "/admin/payouts", icon: Wallet  },
];

export function AdminNav({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      background: "var(--surface-1, var(--card))",
      position: "sticky", top: 0, zIndex: 30,
      backdropFilter: "blur(8px)",
    }}>
      <div style={{
        maxWidth: 1080, margin: "0 auto",
        padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 18,
      }}>
        <Link href="/admin/teams" style={{
          display: "flex", alignItems: "center", gap: 8,
          textDecoration: "none",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(168,85,247,0.18))",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={14} style={{ color: "#fca5a5" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Admin
          </span>
        </Link>

        <nav style={{ display: "flex", gap: 4, flex: 1 }}>
          {ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "7px 12px", borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                textDecoration: "none",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                background: active ? "var(--elevated)" : "transparent",
                border: active ? "1px solid var(--border)" : "1px solid transparent",
              }}>
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--text-disabled)" }}>
            {adminEmail}
          </span>
          <Link href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px", borderRadius: 7,
            fontSize: 11, fontWeight: 600,
            background: "var(--elevated)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", textDecoration: "none",
          }}>
            <LayoutDashboard size={12} />
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
