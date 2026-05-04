"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield, Lock, Eye, Server, Key, AlertTriangle,
  CheckCircle, ArrowRight, FileText, Users
} from "lucide-react";

const PRACTICES = [
  {
    icon: Lock,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Zero Contract Storage",
    desc: "Smart contract source code submitted for analysis is processed entirely in-memory and immediately discarded. We retain only a SHA-256 hash of the contract for audit report integrity verification. Your code never touches a persistent storage layer.",
    badge: "Privacy by Design",
  },
  {
    icon: Key,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Password Security",
    desc: "All passwords are hashed using bcrypt with a cost factor of 12 before storage. Plain-text passwords are never stored, logged, or transmitted. Our systems cannot recover your password — only reset it via a secure tokenized flow.",
    badge: "bcrypt / cost 12",
  },
  {
    icon: Server,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Infrastructure Security",
    desc: "All services run on SOC 2 Type II certified cloud infrastructure. Network traffic between services uses mTLS. Production databases are isolated in private VPCs with no public internet exposure. Backups are encrypted at rest using AES-256.",
    badge: "SOC 2 Type II",
  },
  {
    icon: Eye,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Transport Security",
    desc: "All communication with AuditSmart uses TLS 1.3 with HSTS enforced. We maintain an A+ rating on SSL Labs. API endpoints enforce strict rate limiting and request signing to prevent replay attacks.",
    badge: "TLS 1.3 / HSTS",
  },
  {
    icon: Users,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Authentication Security",
    desc: "Sessions use signed JWTs with short expiry windows (30 days) and are invalidated on password change or logout. OAuth tokens from GitHub and Google are never stored — only the user profile data we need. CSRF protection on all form endpoints.",
    badge: "JWT / OAuth 2.0",
  },
  {
    icon: FileText,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "API Security",
    desc: "All API endpoints require authentication. Rate limiting is enforced per IP and per user using Upstash Redis. API keys are hashed before storage and scoped to minimum required permissions. Keys can be revoked instantly from the dashboard.",
    badge: "Rate Limited",
  },
];

const CERTS = [
  { label: "SOC 2 Type II", desc: "Annual third-party security audit of our controls and processes." },
  { label: "99.9% SLA Uptime", desc: "Contractual uptime guarantee backed by real monitoring." },
  { label: "Bug Bounty Program", desc: "Responsible disclosure rewards for security researchers." },
  { label: "Zero-Knowledge Audits", desc: "Your contract code is never stored on our servers." },
];

const BOUNTY_TIERS = [
  { severity: "Critical", range: "$500 – $2,000", color: "var(--destructive)", bg: "rgba(239,68,68,0.08)", examples: "RCE, auth bypass, full data exfiltration" },
  { severity: "High", range: "$200 – $500", color: "var(--warning)", bg: "rgba(245,158,11,0.08)", examples: "Privilege escalation, IDOR, payment bypass" },
  { severity: "Medium", range: "$50 – $200", color: "var(--brand)", bg: "rgba(0,212,255,0.08)", examples: "XSS, CSRF, sensitive info disclosure" },
  { severity: "Low", range: "$10 – $50", color: "var(--brand-green)", bg: "rgba(0,255,148,0.08)", examples: "Non-sensitive info disclosure, minor issues" },
];

export default function SecurityPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,212,255,0.09) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(123,47,255,0.10))",
              border: "1px solid rgba(0,212,255,0.20)",
            }}
          >
            <Shield size={30} style={{ color: "var(--brand)" }} />
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
            style={{
              background: "linear-gradient(135deg, var(--text-primary) 40%, var(--brand))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            Security at AuditSmart
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
            We&apos;re a security company. That means we hold our own platform to the same exacting standards we apply to the smart contracts we audit.
          </p>
        </div>
      </section>

      {/* Certs */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CERTS.map((c) => (
              <div
                key={c.label}
                className="rounded-xl p-5"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
              >
                <CheckCircle size={18} className="mb-3" style={{ color: "var(--brand-green)" }} />
                <div className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{c.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              Our Security Practices
            </h2>
            <p className="text-base" style={{ color: "var(--text-muted)" }}>
              Defense in depth across every layer of the platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {PRACTICES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl p-6"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: p.bg }}
                    >
                      <Icon size={20} style={{ color: p.color }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h3>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: p.bg, color: p.color }}
                      >
                        {p.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bug Bounty */}
      <section className="py-20 px-4 sm:px-6" style={{ background: "var(--surface-1)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--warning)" }}
            >
              <AlertTriangle size={11} />
              Bug Bounty Program
            </div>
            <h2
              className="text-3xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              Responsible Disclosure
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
              We reward security researchers who find and responsibly disclose vulnerabilities in AuditSmart. We commit to acknowledging reports within 2 hours and paying bounties within 14 days of verification.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {BOUNTY_TIERS.map((tier, i) => (
              <div
                key={tier.severity}
                className="flex flex-wrap items-center gap-4 px-6 py-4"
                style={{
                  background: i % 2 === 0 ? "var(--background)" : "var(--surface-1)",
                  borderBottom: i < BOUNTY_TIERS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold w-20 text-center"
                  style={{ background: tier.bg, color: tier.color }}
                >
                  {tier.severity}
                </span>
                <span className="text-sm font-bold w-32" style={{ color: "var(--text-primary)" }}>{tier.range}</span>
                <span className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>{tier.examples}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              To report a vulnerability, email us at{" "}
              <a href="mailto:security@auditsmart.org" className="font-semibold" style={{ color: "var(--brand)" }}>
                security@auditsmart.org
              </a>{" "}
              with full reproduction steps and impact assessment.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
            >
              Report a Vulnerability <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Security Questions?
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Our security team is available 24/7 for urgent disclosures.
          </p>
          <a
            href="mailto:security@auditsmart.org"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              color: "var(--brand)",
              border: "1px solid var(--border-strong)",
              background: "var(--brand-faint)",
            }}
          >
            security@auditsmart.org <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
