// components/layout/DashboardSidebar.tsx
"use client";

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
    name?: string | null;
    email?: string | null;
  };
}

function SidebarContent({ user, onClose }: SidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const plan = (user?.plan || "FREE").toUpperCase();
  const [remaining, setRemaining] = useState<number | null>(user?.auditsRemaining ?? null);
  const [maxAudits, setMaxAudits] = useState<number>(user?.maxAudits ?? 3);

  useEffect(() => {
    // Only fetch if the layout didn't supply hydrated values (e.g. auditsRemaining
    // is undefined, meaning the server query failed or component is used standalone).
    if (user?.auditsRemaining !== undefined) return;

    fetch("/api/user/limits")
      .then((r) => r.json())
      .then((d) => {
        if (d.remaining !== undefined) setRemaining(d.remaining);
        if (d.limit    !== undefined) setMaxAudits(d.limit);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const left = remaining ?? 0;
  const pct = maxAudits > 0 ? Math.min(100, (left / maxAudits) * 100) : 0;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="flex flex-col h-full bg-surface-1 border-r border-border font-sans">
      {/* Logo */}
      <div className="flex h-14 md:h-16 items-center gap-2 px-4 md:px-5 flex-shrink-0 border-b border-border">
        <div
          className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(123,47,255,0.12))",
            border: "1px solid rgba(0,212,255,0.20)",
          }}
        >
          <Shield size={16} className="text-brand" />
        </div>
        <span
          className="text-sm md:text-base font-extrabold tracking-tight"
          style={{
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
      <div className="p-3 md:p-4">
        <Link
          href="/dashboard/scan"
          onClick={handleLinkClick}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-white font-bold text-xs md:text-sm transition-opacity hover:opacity-85"
          style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline">New Audit</span>
          <span className="sm:hidden">Scan</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 md:px-3">
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 mb-2 text-text-disabled">
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
              onClick={handleLinkClick}
              className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all mb-0.5
                ${isActive
                  ? "bg-[rgba(0,212,255,0.07)] border border-[rgba(0,212,255,0.12)] text-brand"
                  : "border border-transparent text-text-secondary"}`}
            >
              <Icon
                size={16}
                className={isActive ? "text-brand" : "text-text-disabled"}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px my-3 bg-border" />

        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 mb-2 text-text-disabled">
          Actions
        </p>

        <Link
          href="/dashboard/billing"
          onClick={handleLinkClick}
          className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all border border-transparent hover:bg-white/5 text-text-secondary"
        >
          <TrendingUp size={16} className="text-text-disabled" />
          <span>Upgrade Plan</span>
        </Link>

        <Link
          href="/dashboard/deep-audit"
          onClick={handleLinkClick}
          className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all border border-transparent hover:bg-white/5 text-text-secondary"
        >
          <Zap size={16} className="text-brand-pink" />
          <span>Deep Audit · $20</span>
        </Link>
      </nav>

      {/* Plan usage card */}
      <div className="p-3 md:p-4 flex-shrink-0">
        <div className="rounded-xl p-3 md:p-4 bg-surface-2 border border-border">
          <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider mb-1 text-brand">
            {plan} Plan
          </div>
          <div className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary">
            {left}
          </div>
          <div className="text-[10px] md:text-[11px] mb-2 text-text-disabled">
            audits remaining
          </div>
          <div className="h-1 rounded-full overflow-hidden mb-2 bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--brand), var(--brand-green))",
              }}
            />
          </div>
          <Link
            href="/dashboard/billing"
            onClick={handleLinkClick}
            className="block w-full py-2 rounded-md text-center text-xs font-bold transition-opacity hover:opacity-85 text-white"
            style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
          >
            Upgrade →
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function DashboardSidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileOpen((p) => !p);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent user={user} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 w-72 h-full transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-surface-2 border border-border text-text-muted"
          >
            <X size={16} />
          </button>
          <SidebarContent user={user} onClose={() => setMobileOpen(false)} />
        </div>
      </div>
    </>
  );
}
