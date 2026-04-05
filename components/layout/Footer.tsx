"use client";
// components/layout/Footer.tsx

import Link from "next/link";
import {
  FaTwitter, FaGithub, FaLinkedin, FaEnvelope,
  FaShieldAlt, FaClock, FaCheckCircle, FaBolt,
  FaArrowRight, FaTelegram, FaDiscord,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const SOCIAL_LINKS = [
  { name: "Twitter",  icon: FaTwitter,  href: "https://twitter.com/auditsmart1" },
  { name: "GitHub",   icon: FaGithub,   href: "https://github.com/auditsmart" },
  { name: "LinkedIn", icon: FaLinkedin, href: "https://www.linkedin.com/company/audit-smart/" },
  { name: "Telegram", icon: FaTelegram, href: "https://t.me/auditsmart1" },
  { name: "Discord",  icon: FaDiscord,  href: "https://discord.gg/BHJNbEtxBE" },
  { name: "Email",    icon: FaEnvelope, href: "mailto:hello@auditsmart.io" },
];

const BADGES = [
  { label: "SOC 2 Type II", icon: FaShieldAlt },
  { label: "99.9% Uptime",  icon: FaClock },
  { label: "Audited",       icon: FaCheckCircle },
  { label: "Instant Scans", icon: FaBolt },
];

export function Footer() {
  const year = new Date().getFullYear();

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
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)" }}
              >
                Stay ahead of threats
              </h3>
              <p
                className="text-sm"
                style={{ fontFamily: "'Satoshi', sans-serif", color: "var(--text-muted)" }}
              >
                Get the latest vulnerability reports and security best practices in your inbox.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                className="flex-1 h-10 text-sm border-[var(--border)] bg-[var(--elevated)] focus-visible:ring-[var(--brand)]"
                style={{ color: "var(--text-primary)", fontFamily: "'Satoshi', sans-serif" }}
              />
              <Button
                className="h-10 gap-2 text-white shrink-0"
                style={{ background: "var(--brand)" }}
              >
                Subscribe
                <FaArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Link grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{
                  fontFamily: "'DM Mono', monospace",
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
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-4 mb-10"
          style={{
            background: "var(--elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <FaShieldAlt className="h-4 w-4" style={{ color: "var(--brand)" }} />
            <span
              className="text-sm font-medium"
              style={{ fontFamily: "'DM Mono', monospace", color: "var(--text-secondary)" }}
            >
              Enterprise-grade security
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full"
                  style={{
                    fontFamily: "'Satoshi', sans-serif",
                    color: "var(--text-muted)",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Icon className="h-3 w-3" style={{ color: "var(--brand)" }} />
                  {b.label}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }} />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "var(--brand-faint)" }}
            >
              <FaShieldAlt className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            </div>
            <span
              className="text-base font-bold"
              style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)" }}
            >
              Audit<span style={{ color: "var(--brand)" }}>Smart</span>
            </span>
          </Link>

          {/* Copyright */}
          <p
            className="text-xs text-center"
            style={{ color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}
          >
            © {year} AuditSmart. All rights reserved. Securing the future of smart contracts.
          </p>

          {/* Social */}
          <div className="flex gap-3.5">
            {SOCIAL_LINKS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="transition-colors hover:text-[var(--brand)]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}