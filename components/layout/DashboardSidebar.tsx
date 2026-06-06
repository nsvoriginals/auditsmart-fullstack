// components/layout/DashboardSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { PLAN_DETAILS } from "@/lib/plans";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserLimits } from "@/lib/state/user-limits";
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
  Atom,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview",      href: "/dashboard",            icon: LayoutDashboard },
  { label: "Scan Contract", href: "/dashboard/scan",       icon: PlusCircle     },
  { label: "Monitor",       href: "/dashboard/monitor",    icon: Activity       },
  { label: "Audit History", href: "/dashboard/history",    icon: History        },
  { label: "Billing",       href: "/dashboard/billing",    icon: CreditCard     },
  { label: "Settings",      href: "/dashboard/settings",   icon: Settings       },
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
  const router = useRouter();
  const limits = useUserLimits({
    plan: user?.plan,
    remaining: user?.auditsRemaining ?? null,
    limit: user?.maxAudits ?? null,
  });

  const plan = limits.plan;
  const PLAN_LABEL: Record<string, string> = { FREE: "Free", PREMIUM: "Pro", ENTERPRISE: "Enterprise", ADMIN: "Admin" };
  const planLabel = PLAN_LABEL[plan] ?? plan;
  const remaining = limits.remaining;
  const maxAudits = limits.limit ?? user?.maxAudits ?? 10;

  useEffect(() => {
    // Prefetch internal navigation routes on idle so clicks are instant
    const routes = [
      "/dashboard", "/dashboard/scan", "/dashboard/history", "/dashboard/audit",
      "/dashboard/billing", "/dashboard/monitor", "/dashboard/settings",
      "/dashboard/deep-audit", "/dashboard/quantum",
    ];
    const idle = (window as any).requestIdleCallback ?? ((cb: any) => setTimeout(cb, 200));
    idle(() => routes.forEach((r) => router.prefetch(r)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const left = remaining ?? 0;
  const pct = maxAudits > 0 ? Math.min(100, (left / maxAudits) * 100) : 0;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="flex flex-col h-full bg-surface-1 border-r border-border font-sans">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 flex-shrink-0 border-b border-border">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-faint border"
          style={{ borderColor: "rgba(99,102,241,0.22)" }}
        >
          <Shield size={18} className="text-brand" />
        </div>
        <span className="text-base font-semibold tracking-tight text-text-primary">
          AuditSmart
        </span>
      </div>

      {/* New audit button */}
      <div className="p-3 md:p-4">
        <Link
          href="/dashboard/scan"
          prefetch={true}
          onClick={handleLinkClick}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-[var(--brand-hover)] hover:shadow-brand transition-all duration-150"
        >
          <PlusCircle size={16} />
          <span className="hidden sm:inline">New Audit</span>
          <span className="sm:hidden">Scan</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <p className="text-[11px] font-mono uppercase tracking-wider px-3 mb-2 text-text-disabled">
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
              prefetch={true}
              onClick={handleLinkClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-150 mb-0.5
                ${isActive
                  ? "bg-brand-faint text-brand"
                  : "text-text-secondary hover:text-text-primary hover:bg-[var(--surface-2)]"}`}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-brand" />}
              <Icon
                size={18}
                className={isActive ? "text-brand" : "text-text-muted"}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px my-4 bg-border" />

        {/* ── Quantum section ── */}
        <p className="text-[11px] font-mono uppercase tracking-wider px-3 mb-2 text-text-disabled">
          Quantum
        </p>

        {(() => {
          const isQuantumActive = pathname?.startsWith("/dashboard/quantum");
          const isPaid = ["PREMIUM", "ENTERPRISE", "ADMIN"].includes(plan);
          return (
            <Link
              href="/dashboard/quantum"
              prefetch={true}
              onClick={handleLinkClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-150 mb-0.5
                ${isQuantumActive
                  ? "bg-[rgba(139,92,246,0.1)] text-purple"
                  : "text-text-secondary hover:text-text-primary hover:bg-[var(--surface-2)]"}`}
            >
              {isQuantumActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[var(--brand-purple)]" />}
              <Atom
                size={18}
                className={isQuantumActive || isPaid ? "text-purple" : "text-text-muted"}
              />
              <span className="truncate">Quantum Audit</span>
              <span className={`ml-auto flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${isPaid ? "badge-purple" : "badge-brand"}`}>
                {isPaid ? "Beta" : "Pro+"}
              </span>
            </Link>
          );
        })()}

        <div className="h-px my-4 bg-border" />

        <p className="text-[11px] font-mono uppercase tracking-wider px-3 mb-2 text-text-disabled">
          Actions
        </p>

        <Link
          href="/dashboard/billing"
          prefetch={true}
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-150 text-text-secondary hover:text-text-primary hover:bg-[var(--surface-2)]"
        >
          <TrendingUp size={18} className="text-text-muted" />
          <span>Upgrade Plan</span>
        </Link>

        <Link
          href="/dashboard/deep-audit"
          prefetch={true}
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-150 text-text-secondary hover:text-text-primary hover:bg-[var(--surface-2)]"
        >
          <Zap size={18} className="text-brand" />
          <span>Deep Audit</span>
        </Link>
      </nav>

      {/* Plan usage card */}
      <div className="p-3 md:p-4 flex-shrink-0">
        <div className="rounded-xl p-4 bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand">
              {planLabel}
            </span>
            <span className="text-[11px] font-mono text-text-muted tabular-nums">{left}/{maxAudits}</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-3xl font-bold tracking-tight tabular-nums text-text-primary leading-none">{left}</span>
            <span className="text-xs text-text-muted">left</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-4 bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <Link
            href="/dashboard/billing"
            onClick={handleLinkClick}
            className="flex items-center justify-center w-full h-9 rounded-lg text-center text-sm font-medium bg-primary text-primary-foreground shadow-sm hover:bg-[var(--brand-hover)] transition-all duration-150"
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
