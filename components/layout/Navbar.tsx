"use client";
// components/layout/Navbar.tsx

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

  // Get dynamic background based on scroll and theme
  const getNavBackground = () => {
    if (scrolled) {
      return resolvedTheme === "dark" 
        ? "rgba(5,5,8,0.92)" 
        : "rgba(248,249,255,0.92)";
    }
    return resolvedTheme === "dark"
      ? "rgba(5,5,8,0.75)"
      : "rgba(248,249,255,0.75)";
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: getNavBackground(),
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.3s ease",
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34, height: 34,
            borderRadius: 9,
            background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(123,47,255,0.12))",
            border: "1px solid rgba(0,212,255,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={18} style={{ color: "var(--brand)" }} />
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "-0.025em",
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
      <div
        style={{
          display: "flex",
          gap: 32,
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-secondary)",
        }}
        className="hidden md:flex"
      >
        {NAV_ITEMS.map((item) => (
          <a
            key={item.name}
            href={item.href}
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "color 0.2s",
              fontFamily: "'Satoshi', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)")}
          >
            {item.name}
          </a>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="hidden md:flex">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            style={{
              width: 38, height: 38,
              borderRadius: 8,
              background: resolvedTheme === "dark" ? "rgba(0,212,255,0.06)" : "rgba(123,47,255,0.06)",
              border: `1px solid ${resolvedTheme === "dark" ? "rgba(0,212,255,0.15)" : "rgba(123,47,255,0.15)"}`,
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.2s, color 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--brand)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = resolvedTheme === "dark" ? "rgba(0,212,255,0.15)" : "rgba(123,47,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        <Link
          href="/login"
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-secondary)",
            border: "1px solid var(--border-strong)",
            background: "transparent",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "'Satoshi', sans-serif",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--brand)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-strong)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
          }}
        >
          Login
        </Link>
        <Link
          href="/register"
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            transition: "opacity 0.2s, box-shadow 0.2s",
            border: "none",
            fontFamily: "'Satoshi', sans-serif",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-purple)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
          }}
        >
          Start Free Audit
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: 8,
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          display: "none",
        }}
        className="md:hidden flex"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: 64,
            zIndex: 90,
            background: resolvedTheme === "dark" ? "rgba(5,5,8,0.97)" : "rgba(248,249,255,0.97)",
            backdropFilter: "blur(20px)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border)",
                textDecoration: "none",
                transition: "color 0.2s",
                fontFamily: "'Satoshi', sans-serif",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)")}
            >
              {item.name}
            </a>
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            style={{
              marginTop: 16,
              padding: 14,
              background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
              color: "#fff",
              borderRadius: 10,
              textAlign: "center",
              fontWeight: 800,
              fontSize: 14,
              textDecoration: "none",
              display: "block",
              fontFamily: "'Satoshi', sans-serif",
            }}
          >
            Start Free Audit →
          </Link>
        </div>
      )}
    </nav>
  );
}