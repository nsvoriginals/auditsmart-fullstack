"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield, Target, Zap, Users, Globe, Award,
  ArrowRight, CheckCircle, TrendingUp, Lock
} from "lucide-react";

const STATS = [
  { value: "10,000+", label: "Contracts Audited" },
  { value: "56%+", label: "Avg Detection Rate" },
  { value: "<60s", label: "Average Scan Time" },
  { value: "99.9%", label: "Platform Uptime" },
];

const VALUES = [
  {
    icon: Shield,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Security First",
    desc: "Every decision we make starts with security. We build tools we'd trust with our own funds deployed on mainnet.",
  },
  {
    icon: Target,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Radical Transparency",
    desc: "Our methodology is open. We publish our detection rates, false positive ratios, and benchmark results publicly.",
  },
  {
    icon: Zap,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Speed Without Compromise",
    desc: "Fast doesn't mean shallow. Our multi-agent pipeline runs 10 parallel analyses in under 60 seconds.",
  },
  {
    icon: Users,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Developer Obsessed",
    desc: "Built by developers who got burned by exploits. We make professional-grade security accessible to every dev.",
  },
];

const TIMELINE = [
  { year: "2023", title: "Founded", desc: "AuditSmart born out of frustration with slow, expensive manual audits in the DeFi space." },
  { year: "Q1 2024", title: "First Agent Pipeline", desc: "Launched our 8-agent parallel analysis system powered by Groq LLaMA 3.3 70B." },
  { year: "Q2 2024", title: "Gemini Integration", desc: "Added Google Gemini as a cross-validator, dramatically reducing false positives." },
  { year: "Q3 2024", title: "PDF Reports & API", desc: "Introduced branded PDF audit reports and developer API access for CI/CD integration." },
  { year: "2025", title: "Claude AI Upgrade", desc: "Integrated Anthropic Claude Opus for Deep Audit — the most thorough automated audit on the market." },
];

const TEAM = [
  {
    name: "Alex Chen",
    role: "Co-Founder & CEO",
    bio: "Ex-Ethereum Foundation. Found 12 critical vulns in major DeFi protocols before starting AuditSmart.",
    avatar: "AC",
    color: "var(--brand)",
  },
  {
    name: "Priya Sharma",
    role: "Co-Founder & CTO",
    bio: "ML researcher turned smart contract security expert. Designed our multi-agent vulnerability detection pipeline.",
    avatar: "PS",
    color: "var(--brand-purple)",
  },
  {
    name: "Marcus Webb",
    role: "Head of Security Research",
    bio: "Former blockchain auditor at Trail of Bits. Has audited $2B+ in on-chain value across 150+ protocols.",
    avatar: "MW",
    color: "var(--brand-pink)",
  },
  {
    name: "Yuki Tanaka",
    role: "Lead Engineer",
    bio: "Built high-frequency trading infrastructure before pivoting to Web3. Obsessed with sub-second performance.",
    avatar: "YT",
    color: "var(--brand-green)",
  },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(123,47,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)", color: "var(--brand)" }}
          >
            <Globe size={12} />
            Our Story
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
            style={{
              background: "linear-gradient(135deg, var(--text-primary) 40%, var(--brand-purple) 80%, var(--brand))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            We make Web3 safer,
            <br />one audit at a time.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
            AuditSmart was founded by developers who lost funds to smart contract exploits. We built the tool we wished existed — fast, thorough, and accessible to every builder.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--border)" }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center py-10 px-4 text-center"
                style={{ background: "var(--surface-1)" }}
              >
                <span
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
                  style={{ color: "var(--brand)", letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </span>
                <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              Our Mission
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
              Over $3 billion has been lost to smart contract exploits. Most vulnerabilities are preventable — the barrier is cost and time. Professional audits take weeks and cost tens of thousands of dollars.
            </p>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              We&apos;re changing that. AuditSmart delivers professional-grade security analysis in under 60 seconds at a fraction of the cost. Every developer, regardless of budget, deserves the tools to deploy safely.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "10 specialized AI agents run in parallel",
                "False positives automatically removed",
                "Actionable fix code for every finding",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={16} style={{ color: "var(--brand-green)", flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-2xl p-8"
            style={{
              background: "linear-gradient(135deg, rgba(123,47,255,0.08), rgba(0,212,255,0.06))",
              border: "1px solid var(--border)",
            }}
          >
            <Lock size={32} style={{ color: "var(--brand)", marginBottom: 20 }} />
            <blockquote
              className="text-lg font-semibold leading-relaxed italic"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.015em" }}
            >
              &quot;The best time to audit a smart contract is before deployment. The second best time is right now.&quot;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--brand-faint)", color: "var(--brand)" }}
              >
                AC
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Alex Chen</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Co-Founder & CEO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6" style={{ background: "var(--surface-1)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              What We Stand For
            </h2>
            <p className="text-base" style={{ color: "var(--text-muted)" }}>
              Principles that guide every line of code we write.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-2xl p-6"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: v.bg }}
                  >
                    <Icon size={20} style={{ color: v.color }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{v.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              Our Journey
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute left-4 top-0 bottom-0 w-px"
              style={{ background: "var(--border)" }}
            />
            <div className="flex flex-col gap-10">
              {TIMELINE.map((item) => (
                <div key={item.year} className="flex gap-6 pl-12 relative">
                  <div
                    className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, var(--brand-purple), var(--brand))",
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: "var(--brand)", letterSpacing: "0.1em" }}
                    >
                      {item.year}
                    </div>
                    <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6" style={{ background: "var(--surface-1)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              The Team
            </h2>
            <p className="text-base" style={{ color: "var(--text-muted)" }}>
              Security researchers, engineers, and former auditors on a mission.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl p-6 text-center"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${member.color}22, ${member.color}11)`,
                    border: `2px solid ${member.color}33`,
                    color: member.color,
                  }}
                >
                  {member.avatar}
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{member.name}</h3>
                <div
                  className="text-xs font-semibold mb-3"
                  style={{ color: "var(--brand)" }}
                >
                  {member.role}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Award size={36} className="mx-auto mb-6" style={{ color: "var(--brand)" }} />
          <h2
            className="text-3xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Join 10,000+ developers securing their contracts
          </h2>
          <p className="text-base mb-8" style={{ color: "var(--text-muted)" }}>
            Start your free audit today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
            >
              Start Free Audit <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)", background: "transparent" }}
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
