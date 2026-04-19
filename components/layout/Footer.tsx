// components/layout/Footer.tsx (Updated - Clean Version)

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaTwitter, FaLinkedin, FaEnvelope,
  FaShieldAlt, FaClock, FaCheckCircle, FaBolt,
  FaArrowRight, FaTelegram, FaDiscord,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Subscribed successfully!");
    setEmail("");
    setSubscribing(false);
  };

  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--sidebar)",
      }}
    >
      {/* Newsletter */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            <div>
              <h3
                className="text-xl md:text-2xl font-bold mb-2"
                style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}
              >
                Stay ahead of threats
              </h3>
              <p
                className="text-sm"
                style={{ fontFamily: "'Satoshi', sans-serif", color: "var(--text-muted)" }}
              >
                Get the latest vulnerability reports and security best practices.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-10 text-sm border-[var(--border)] bg-[var(--elevated)] focus-visible:ring-[var(--brand)]"
                style={{ color: "var(--text-primary)", fontFamily: "'Satoshi', sans-serif" }}
              />
              <Button
                type="submit"
                disabled={subscribing}
                className="h-10 gap-2 text-white shrink-0"
                style={{ background: "var(--brand)" }}
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
                <FaArrowRight className="h-3 w-3" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4
                className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 md:mb-4"
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "var(--text-disabled)",
                }}
              >
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs md:text-[13px] transition-colors hover:text-[var(--brand)]"
                      style={{
                        color: "var(--text-muted)",
                        fontFamily: "'Satoshi', sans-serif",
                      }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Security badges */}
        <div
          className="flex flex-wrap items-center justify-center md:justify-between gap-3 rounded-xl px-4 md:px-6 py-4 mb-8 md:mb-10"
          style={{
            background: "var(--elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <FaShieldAlt className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <span
              className="text-xs md:text-sm font-medium"
              style={{ fontFamily: "'Satoshi', sans-serif", color: "var(--text-secondary)" }}
            >
              Enterprise-grade security
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs rounded-full"
                  style={{
                    fontFamily: "'Satoshi', sans-serif",
                    color: "var(--text-muted)",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Icon className="h-3 w-3" style={{ color: "var(--brand)" }} />
                  <span className="hidden sm:inline">{b.label}</span>
                  <span className="sm:hidden">{b.label.split(" ")[0]}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }} />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "var(--brand-faint)" }}
            >
              <FaShieldAlt className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            </div>
            <span
              className="text-sm md:text-base font-extrabold tracking-tight"
              style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 800, color: "var(--text-primary)" }}
            >
              Audit<span style={{ color: "var(--brand)" }}>Smart</span>
            </span>
          </Link>

          {/* Copyright */}
          <p
            suppressHydrationWarning
            className="text-[11px] md:text-xs text-center order-3 md:order-2"
            style={{ color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}
          >
            © {year} Xorion Network LLC. All rights reserved.
          </p>

          {/* Social links - ONLY 4 required */}
          <div className="flex gap-4 md:gap-5 order-2 md:order-3">
            {SOCIAL_LINKS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="transition-all duration-200 hover:scale-110"
                  style={{ color: "var(--text-disabled)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-disabled)")}
                >
                  <Icon className="h-4 w-4 md:h-4.5 md:w-4.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}