// components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { Menu, X, Shield, Moon, Sun, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";

const NAV_ITEMS = [
  { name: "Features", href: "/#features" },
  { name: "Agents",   href: "/#agents"   },
  { name: "Pricing",  href: "/#pricing"  },
];

// Scroll range (px) over which the bar shrinks from full to its floating pill.
const SHRINK_RANGE = 220;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [y, setY] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => setMounted(true), []);

  // rAF-throttled scroll tracking so the bar follows the scroll position 1:1.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isAuthed = status === "authenticated";
  const isDark = !mounted || resolvedTheme === "dark";

  // p: 0 at top → 1 once scrolled past SHRINK_RANGE (then clamped, so it stops).
  const p = Math.min(1, y / SHRINK_RANGE);

  // Interpolate the floating-pill geometry from p.
  const maxW    = 1240 - p * 380;          // 1240px → 860px, then stops
  const padX    = 16 + p * 8;              // inner horizontal padding grows slightly
  const topGap  = p * 14;                  // bar lifts away from the top edge
  const radius  = p * 999;                 // square → full pill
  const blur    = 4 + p * 14;
  const bgA     = p * (isDark ? 0.72 : 0.78);
  const borderA = p * (isDark ? 0.10 : 0.10);
  const shadow  = p > 0.02 ? `0 8px 30px rgba(0,0,0,${(isDark ? 0.45 : 0.10) * p})` : "none";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-4"
      style={{ paddingTop: `${topGap}px`, pointerEvents: "none" }}
    >
      <div
        className="flex items-center justify-between gap-4 w-full"
        style={{
          pointerEvents: "auto",
          maxWidth: `${maxW}px`,
          height: 60 - p * 4,
          paddingLeft: `${padX}px`,
          paddingRight: `${padX}px`,
          borderRadius: `${radius}px`,
          background: isDark
            ? `rgba(12,14,16,${bgA})`
            : `rgba(255,255,255,${bgA})`,
          border: `1px solid rgba(${isDark ? "255,255,255" : "16,24,40"},${borderA})`,
          backdropFilter: `blur(${blur}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
          boxShadow: shadow,
          willChange: "max-width, height, border-radius",
        }}
      >
        {/* Logo */}
        <Link href={isAuthed ? "/dashboard" : "/"} className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-faint border transition-colors group-hover:bg-[var(--brand-faint-hover)]"
            style={{ borderColor: "rgba(99,102,241,0.22)" }}
          >
            <Shield size={16} style={{ color: "var(--brand)" }} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-primary">
            AuditSmart
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="px-3 py-2 rounded-lg font-medium text-secondary hover:text-primary hover:bg-[var(--surface-2)] transition-all duration-150"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex gap-2 items-center flex-shrink-0">
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border)] transition-all duration-150"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <div suppressHydrationWarning className="flex items-center gap-2">
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium text-primary-foreground bg-primary shadow-sm hover:bg-[var(--brand-hover)] hover:shadow-brand transition-all duration-150"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 h-9 flex items-center rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-[var(--surface-2)] transition-all duration-150"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 h-9 flex items-center rounded-lg text-sm font-medium text-primary-foreground bg-primary shadow-sm hover:bg-[var(--brand-hover)] hover:shadow-brand transition-all duration-150"
                >
                  Start free audit
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-secondary hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="fixed inset-x-0 top-16 z-40 p-5 flex flex-col gap-1 md:hidden animate-slide-down"
          style={{
            background: "var(--background)",
            borderBottom: "1px solid var(--border)",
            pointerEvents: "auto",
          }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3 px-3 rounded-lg text-[15px] font-medium text-secondary hover:text-primary hover:bg-[var(--surface-2)] transition-colors"
            >
              {item.name}
            </a>
          ))}

          <div className="mt-4 pt-4 border-t flex gap-3" suppressHydrationWarning>
            {isAuthed ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex-1 h-11 rounded-lg text-center font-medium text-primary-foreground bg-primary flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-11 rounded-lg text-center font-medium text-primary border border-border flex items-center justify-center"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-11 rounded-lg text-center font-medium text-primary-foreground bg-primary flex items-center justify-center"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
