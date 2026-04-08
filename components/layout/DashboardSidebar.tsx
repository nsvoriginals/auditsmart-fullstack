"use client";
// components/layout/DashboardSidebar.tsx

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  CreditCard,
  Settings,
  Shield,
  PlusCircle,
  Activity,
  Zap,
  X,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview",      href: "/dashboard",          icon: LayoutDashboard },
  { label: "Scan Contract", href: "/dashboard/scan",      icon: PlusCircle     },
  { label: "Monitor",       href: "/dashboard/monitor",   icon: Activity       },
  { label: "Audit History", href: "/dashboard/history",   icon: History        },
  { label: "Billing",       href: "/dashboard/billing",   icon: CreditCard     },
  { label: "Settings",      href: "/dashboard/settings",  icon: Settings       },
];

interface SidebarProps {
  user?: {
    plan?: string;
    auditsRemaining?: number;
    maxAudits?: number;
  };
}

function SidebarContent({ user }: SidebarProps) {
  const pathname = usePathname();
  const plan = (user?.plan || "free").toUpperCase();
  const left = user?.auditsRemaining ?? 3;
  const max = user?.maxAudits ?? 3;
  const pct = Math.min(100, (left / max) * 100);

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border)",
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          height: 60,
          alignItems: "center",
          gap: 8,
          padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(123,47,255,0.12))",
            border: "1px solid rgba(0,212,255,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={15} style={{ color: "var(--brand)" }} />
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: "-0.025em",
            background: "linear-gradient(90deg, var(--text-primary) 60%, var(--brand))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AuditSmart
        </span>
      </div>

      {/* New audit button */}
      <div style={{ padding: "16px 12px 8px" }}>
        <Link
          href="/dashboard/scan"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "10px",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
        >
          <PlusCircle size={13} />
          New Audit
        </Link>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "8px 12px",
          overflowY: "auto",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--text-disabled)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0 10px",
            marginBottom: 6,
            fontFamily: "'Satoshi', sans-serif",
          }}
        >
          Workspace
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--brand)" : "var(--text-secondary)",
                background: isActive ? "rgba(0,212,255,0.07)" : "transparent",
                border: isActive ? "1px solid rgba(0,212,255,0.12)" : "1px solid transparent",
                marginBottom: 2,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon
                size={16}
                style={{ color: isActive ? "var(--brand)" : "var(--text-disabled)", flexShrink: 0 }}
              />
              {item.label}
            </Link>
          );
        })}

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--text-disabled)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0 10px",
            marginBottom: 6,
            fontFamily: "'Satoshi', sans-serif",
          }}
        >
          Actions
        </p>
        <Link
          href="/pricing"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "1px solid transparent",
            marginBottom: 2,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
          }}
        >
          <TrendingUp size={16} style={{ color: "var(--text-disabled)", flexShrink: 0 }} />
          Upgrade Plan
        </Link>
        <Link
          href="/dashboard/deep-audit"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "1px solid transparent",
            marginBottom: 2,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
          }}
        >
          <Zap size={16} style={{ color: "var(--brand-pink)", flexShrink: 0 }} />
          Deep Audit · $20
        </Link>
      </nav>

      {/* Plan usage card */}
      <div style={{ padding: "12px", flexShrink: 0 }}>
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--brand)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 6,
              fontFamily: "'Satoshi', sans-serif",
            }}
          >
            {plan} Plan
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "'Satoshi', sans-serif",
              letterSpacing: "-0.025em",
              lineHeight: 1,
            }}
          >
            {left}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-disabled)",
              fontFamily: "'Satoshi', sans-serif",
              marginBottom: 10,
            }}
          >
            audits remaining
          </div>
          {/* Usage bar */}
          <div
            style={{
              height: 3,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--brand), var(--brand-green))",
                borderRadius: 2,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <Link
            href="/pricing"
            style={{
              display: "block",
              width: "100%",
              padding: "8px",
              borderRadius: 6,
              background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
          >
            Upgrade Now →
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function DashboardSidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setMobileOpen((p) => !p);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      {/* Desktop */}
      <div
        style={{ width: 220, flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}
        className="hidden md:flex md:flex-col"
      >
        <SidebarContent user={user} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(5,5,8,0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          width: 220,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
        }}
        className="md:hidden"
      >
        <div style={{ position: "relative", height: "100%" }}>
          <button
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              zIndex: 10,
              padding: 6,
              borderRadius: 6,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={14} />
          </button>
          <SidebarContent user={user} />
        </div>
      </div>
    </>
  );
}