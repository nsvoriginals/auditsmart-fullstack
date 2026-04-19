// components/layout/DashboardNavbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  CreditCard,
  Shield,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { signOut, useSession } from "next-auth/react";

interface DashboardNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan?: string;
  };
}

const PLAN_BADGE: Record<string, string> = {
  FREE:       "bg-elevated text-text-muted",
  PRO:        "bg-brand-faint text-brand",
  PREMIUM:    "bg-brand-faint text-brand",
  ENTERPRISE: "bg-[rgba(168,85,247,0.08)] text-[#a855f7]",
  ADMIN:      "bg-[rgba(239,68,68,0.08)] text-[#ef4444]",
};

function getInitials(name?: string | null, email?: string | null) {
  if (name)  return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
}

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const [scrolled,     setScrolled]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [signingOut,   setSigningOut]   = useState(false);
  const [planFromApi, setPlanFromApi] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: session } = useSession();

  const fetchPlan = (bustCache = false) => {
    fetch("/api/user/limits", { cache: bustCache ? "no-store" : "default" })
      .then((r) => r.json())
      .then((d) => { if (d.plan) setPlanFromApi(d.plan.toUpperCase()); })
      .catch(() => {});
  };

  useEffect(() => { fetchPlan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => fetchPlan(true);
    window.addEventListener("plan-upgraded", handler);
    return () => window.removeEventListener("plan-upgraded", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const plan      = (planFromApi || (session?.user?.plan as string) || user?.plan || "FREE").toUpperCase();
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.FREE;
  const PLAN_LABEL: Record<string, string> = { FREE: "Free", PREMIUM: "Pro", ENTERPRISE: "Enterprise", ADMIN: "Admin" };
  const planLabel = PLAN_LABEL[plan] ?? plan;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const openProfile  = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProfileOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setProfileOpen(false), 150);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center gap-2 md:gap-4 px-3 md:px-5 transition-shadow duration-200 bg-card border-b border-border backdrop-blur-md ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 text-text-muted flex-shrink-0"
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search — hidden on mobile */}
      <div className="hidden sm:block flex-1 max-w-xs lg:max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-disabled" />
          <Input
            type="search"
            placeholder="Search audits..."
            className="pl-9 h-8 text-sm border-0 focus-visible:ring-1 bg-elevated text-text-primary font-sans"
          />
        </div>
      </div>

      {/* Mobile search button */}
      <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 text-text-muted">
        <Search className="h-4 w-4" />
      </Button>

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-2 ml-auto">
        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-text-muted hover:text-text-primary flex-shrink-0"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white bg-brand">
            3
          </span>
        </Button>

        {/* Plan badge — desktop only */}
        <span className={`hidden md:inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium font-sans ${planBadge}`}>
          {planLabel} Plan
        </span>

        <ThemeToggle />

        {/* ── Profile hover card ── */}
        <div
          className="relative flex-shrink-0"
          onMouseEnter={openProfile}
          onMouseLeave={scheduleClose}
        >
          {/* Avatar trigger */}
          <button
            className={`relative h-8 w-8 rounded-full transition-all outline-none ${
              profileOpen
                ? "ring-2 ring-brand/40"
                : "hover:ring-2 hover:ring-border"
            }`}
            onClick={() => setProfileOpen((p) => !p)}
            aria-label="Open profile menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm font-bold font-sans bg-brand-faint text-brand select-none">
                {getInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Hover card */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden animate-scale-in"
              onMouseEnter={openProfile}
              onMouseLeave={scheduleClose}
            >
              {/* User info header */}
              <div className="px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-faint flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-extrabold text-brand font-sans">
                      {getInitials(user?.name, user?.email)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight text-text-primary font-sans truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-text-muted font-sans truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                {/* Plan badge */}
                <div className="mt-3 flex items-center gap-2">
                  <Shield size={11} className="text-brand flex-shrink-0" />
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide font-sans ${planBadge}`}>
                    {planLabel} Plan
                  </span>
                </div>
              </div>

              {/* Nav links */}
              <div className="py-1">
                {[
                  { icon: User,       label: "Profile",  href: "/dashboard/settings" },
                  { icon: CreditCard, label: "Billing",  href: "/dashboard/billing"  },
                  { icon: Settings,   label: "Settings", href: "/dashboard/settings" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors font-sans"
                  >
                    <Icon size={14} className="text-text-disabled flex-shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Sign out */}
              <div className="border-t border-border p-2">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-semibold font-sans text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors disabled:opacity-60"
                >
                  {signingOut ? (
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-[rgba(239,68,68,0.3)] border-t-[#ef4444] animate-spin flex-shrink-0" />
                  ) : (
                    <LogOut size={14} className="flex-shrink-0" />
                  )}
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
