// components/layout/Footer.tsx (Updated - Clean Version)

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaTwitter, FaLinkedin, FaEnvelope,
  FaShieldAlt, FaClock, FaCheckCircle, FaBolt,
  FaArrowRight, FaTelegram, FaDiscord,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { name: "Features",      href: "/#features" },
      { name: "Pricing",       href: "/pricing" },
      { name: "Dashboard",     href: "/dashboard" },
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/docs/api" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About",    href: "/about" },
      { name: "Blog",     href: "/blog" },
      { name: "Careers",  href: "/careers" },
      { name: "Contact",  href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Security",         href: "/security" },
      { name: "Status",           href: "/status" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy",   href: "/privacy" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center",     href: "/help" },
      { name: "Community",       href: "/community" },
      { name: "Contact Support", href: "/support" },
      { name: "Report Bug",      href: "/report" },
    ],
  },
];

// ✅ ONLY the 4 required social links (no GitHub)
const SOCIAL_LINKS = [
  { name: "Twitter",   icon: FaTwitter,   href: "https://x.com/auditsmart1" },
  { name: "LinkedIn",  icon: FaLinkedin,  href: "https://www.linkedin.com/company/audit-smart/" },
  { name: "Telegram",  icon: FaTelegram,  href: "https://t.me/auditsmart1" },
  { name: "Discord",   icon: FaDiscord,   href: "https://discord.gg/BHJNbEtxC" },  // ✅ Fixed invite code
  { name: "Email",     icon: FaEnvelope,  href: "mailto:hello@auditsmart.io" },
];

const BADGES = [
  { label: "SOC 2 Type II", icon: FaShieldAlt },
  { label: "99.9% Uptime",  icon: FaClock },
  { label: "Audited",       icon: FaCheckCircle },
  { label: "Instant Scans", icon: FaBolt },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const year = new Date().getFullYear();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong. Please try again.");
      } else {
        toast.success(data.message ?? "Subscribed successfully!");
        setEmail("");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer
      className="mt-auto relative overflow-hidden"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface-1)",
      }}
    >
      {/* ── CTA band ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-end">
          <div>
            <span
              className="inline-flex items-center gap-2.5 mb-5"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.06em", color: "var(--text-muted)" }}
            >
              <span style={{ width: 28, height: 1, background: "var(--brand)" }} />
              START NOW · FREE
            </span>
            <h2
              className="font-bold"
              style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "clamp(30px, 4.5vw, 56px)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                color: "var(--text-primary)",
              }}
            >
              Ship contracts the
              <br />
              adversary <span className="text-gradient">can&apos;t break.</span>
            </h2>
          </div>

          {/* Newsletter, compact */}
          <div className="w-full">
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              Monthly vulnerability briefings &amp; security best practices. No spam.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 text-sm bg-[var(--background)]"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                type="submit"
                disabled={subscribing}
                className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium shrink-0 transition-all duration-150 disabled:opacity-60"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {subscribing ? "Subscribing…" : "Subscribe"}
                <FaArrowRight className="h-3 w-3" />
              </button>
            </form>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
              {BADGES.map((b) => {
                const Icon = b.icon;
                return (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-1.5 text-[11px]"
                    style={{ fontFamily: "'DM Mono', monospace", color: "var(--text-muted)" }}
                  >
                    <Icon className="h-3 w-3" style={{ color: "var(--brand)" }} />
                    {b.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Links ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-10 pt-10"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4
                className="text-[11px] uppercase mb-4"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                  color: "var(--text-disabled)",
                }}
              >
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[13px] transition-colors hover:text-[var(--brand)]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 py-7"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Link href="/" className="flex items-center gap-2 group shrink-0 order-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--brand-faint)" }}>
              <FaShieldAlt className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              AuditSmart
            </span>
          </Link>

          <p
            suppressHydrationWarning
            className="text-[11px] order-3 md:order-2"
            style={{ color: "var(--text-disabled)", fontFamily: "'DM Mono', monospace" }}
          >
            © {year} AuditSmart — all rights reserved
          </p>

          <div className="flex gap-4 order-2 md:order-3">
            {SOCIAL_LINKS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="transition-all duration-200 hover:-translate-y-0.5"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Giant ghost wordmark signature ── */}
      <div
        aria-hidden
        className="select-none pointer-events-none w-full overflow-hidden"
        style={{ lineHeight: 0.78 }}
      >
        <span
          className="block text-center"
          style={{
            fontFamily: "'Satoshi', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(72px, 19vw, 280px)",
            letterSpacing: "-0.05em",
            color: "transparent",
            WebkitTextStroke: "1px var(--border-strong)",
            transform: "translateY(22%)",
            whiteSpace: "nowrap",
          }}
        >
          AuditSmart
        </span>
      </div>
    </footer>
  );
}