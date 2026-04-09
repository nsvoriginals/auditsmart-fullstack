// components/layout/Navbar.tsx (Updated)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const NAV_ITEMS = [
  { name: "Features", href: "/#features" },
  { name: "Agents",   href: "/#agents"   },
  { name: "Pricing",  href: "/#pricing"  },
  { name: "Docs",     href: "/docs"      },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const getNavBackground = () => {
    if (scrolled) {
      return resolvedTheme === "dark" 
        ? "rgba(5,5,8,0.95)" 
        : "rgba(248,249,255,0.95)";
    }
    return resolvedTheme === "dark"
      ? "rgba(5,5,8,0.8)"
      : "rgba(248,249,255,0.8)";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 md:px-10 transition-all duration-300`}
      style={{
        background: getNavBackground(),
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 md:gap-2.5 flex-shrink-0"
      >
        <div
          className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(123,47,255,0.12))",
            border: "1px solid rgba(0,212,255,0.20)",
          }}
        >
          <Shield size={18} style={{ color: "var(--brand)" }} />
        </div>
        <span
          className="text-base md:text-lg font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(90deg, var(--text-primary) 60%, var(--brand))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AuditSmart
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex gap-6 lg:gap-8 text-sm font-medium">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="transition-colors duration-200"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)")}
          >
            {item.name}
          </a>
        ))}
      </div>

      {/* Right actions */}
      <div className="hidden md:flex gap-2 items-center">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-lg transition-all flex items-center justify-center"
            style={{
              background: resolvedTheme === "dark" ? "rgba(0,212,255,0.06)" : "rgba(123,47,255,0.06)",
              border: `1px solid ${resolvedTheme === "dark" ? "rgba(0,212,255,0.15)" : "rgba(123,47,255,0.15)"}`,
              color: "var(--text-secondary)",
            }}
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
          style={{
            color: "var(--text-secondary)",
            borderColor: "var(--border-strong)",
            background: "transparent",
          }}
        >
          Login
        </Link>
        
        <Link
          href="/register"
          className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
          }}
        >
          Start Free Audit
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div
          className="fixed inset-x-0 top-16 z-40 p-5 flex flex-col gap-2 md:hidden"
          style={{
            background: resolvedTheme === "dark" ? "rgba(5,5,8,0.98)" : "rgba(248,249,255,0.98)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 px-2 text-base font-semibold border-b transition-colors"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
              }}
            >
              {item.name}
            </a>
          ))}
          
          <div className="pt-4 flex gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 rounded-lg text-center font-semibold border"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border-strong)",
              }}
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 rounded-lg text-center font-bold text-white"
              style={{
                background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}