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
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview",      href: "/dashboard",          icon: LayoutDashboard },
  { label: "Scan Contract", href: "/dashboard/scan",      icon: PlusCircle },
  { label: "Monitor",       href: "/dashboard/monitor",   icon: Activity },
  { label: "Audit History", href: "/dashboard/history",   icon: History },
  { label: "Billing",       href: "/dashboard/billing",   icon: CreditCard },
  { label: "Settings",      href: "/dashboard/settings",  icon: Settings },
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full flex-col"
      style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-2.5 px-5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--brand-faint)" }}
        >
          <Shield className="h-4 w-4" style={{ color: "var(--brand)" }} />
        </div>
        <span
          className="text-[17px] font-bold"
          style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)" }}
        >
          Audit<span style={{ color: "var(--brand)" }}>Smart</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        <p
          className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ fontFamily: "'DM Mono', monospace", color: "var(--text-disabled)" }}
        >
          Navigation
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
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-all",
                isActive
                  ? "text-[var(--brand)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
              style={{
                fontFamily: "'Satoshi', sans-serif",
                background: isActive ? "var(--brand-faint)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--accent)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? "var(--brand)" : "var(--text-disabled)" }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card */}
      <div className="p-4 mt-auto shrink-0">
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--brand-faint)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)" }}
            >
              Upgrade to Pro
            </span>
          </div>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{ color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}
          >
            Get 20 audits/month and access advanced AI models.
          </p>
          <Button
            size="sm"
            className="w-full text-white shadow-sm"
            style={{ background: "var(--brand)" }}
            asChild
          >
            <Link href="/pricing">Upgrade now</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setMobileOpen((p) => !p);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:w-60 lg:w-64 flex-col shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative h-full">
          <button
            className="absolute right-3 top-3 z-10 p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--accent)]"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent />
        </div>
      </div>
    </>
  );
}