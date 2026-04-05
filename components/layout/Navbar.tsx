"use client";
// components/layout/Navbar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Features", href: "/#features" },
  { name: "Pricing",  href: "/pricing" },
  { name: "Dashboard",href: "/dashboard" },
  { name: "Docs",     href: "/docs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-faint)]">
              <Shield className="w-4 h-4 text-[var(--brand)]" />
            </div>
            <span
              className="text-[17px] font-bold"
              style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)" }}
            >
              Audit<span style={{ color: "var(--brand)" }}>Smart</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href.startsWith("/#") && pathname === "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--brand-faint)] text-[var(--brand)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]"
                  )}
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] shadow-sm"
            >
              <Link href="/register">Get started</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)] transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-[var(--border)] animate-slide-down">
            <div className="flex flex-col gap-1 pt-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)] transition-colors"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border)]">
                <ThemeToggle />
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-[var(--text-muted)]"
                  >
                    <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                  >
                    <Link href="/register" onClick={() => setOpen(false)}>Get started</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}