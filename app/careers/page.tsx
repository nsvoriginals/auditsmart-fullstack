"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MapPin, Clock, ArrowRight, Zap, Heart, Globe, TrendingUp, Users, Shield } from "lucide-react";

const PERKS = [
  {
    icon: Zap,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Fully Remote",
    desc: "Work from anywhere in the world. We're async-first with team sync twice a week.",
  },
  {
    icon: TrendingUp,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Equity Package",
    desc: "Meaningful equity for every team member. We're building something worth owning.",
  },
  {
    icon: Heart,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Health & Wellness",
    desc: "$500/month health stipend plus mental wellness support. We invest in you.",
  },
  {
    icon: Globe,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Learning Budget",
    desc: "$2,000/year for conferences, courses, books, and security certifications.",
  },
  {
    icon: Users,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Small Team, Big Impact",
    desc: "Under 20 people. Your work ships to thousands of developers on day one.",
  },
  {
    icon: Shield,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Mission-Driven",
    desc: "Every line of code you write makes Web3 safer. That actually matters.",
  },
];

const JOBS = [
  {
    id: 1,
    title: "Senior Smart Contract Security Researcher",
    team: "Security",
    type: "Full-time",
    location: "Remote (Worldwide)",
    description: "Lead vulnerability research on the AuditSmart analysis pipeline. You'll design new detection agents, analyze real-world exploits, and publish security research.",
    requirements: [
      "3+ years of smart contract security experience",
      "Deep knowledge of Solidity and EVM architecture",
      "Experience with Slither, Echidna, or Foundry",
      "Track record of responsible disclosures or CTF wins",
    ],
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.06)",
    border: "rgba(0,212,255,0.15)",
  },
  {
    id: 2,
    title: "Full-Stack Engineer (Next.js + Node.js)",
    team: "Engineering",
    type: "Full-time",
    location: "Remote (Worldwide)",
    description: "Build and scale the core AuditSmart platform. You'll work across the full stack from React UI to API design to database optimization.",
    requirements: [
      "4+ years with TypeScript, React/Next.js, and Node.js",
      "Experience with MongoDB/PostgreSQL and REST API design",
      "Familiarity with cloud infrastructure (Vercel, AWS, GCP)",
      "Bonus: experience with Web3 or blockchain tooling",
    ],
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.06)",
    border: "rgba(123,47,255,0.15)",
  },
  {
    id: 3,
    title: "AI/ML Engineer — LLM Security Applications",
    team: "AI Research",
    type: "Full-time",
    location: "Remote (Worldwide)",
    description: "Design and improve our multi-agent AI pipeline for vulnerability detection. You'll work with Groq, Claude, Gemini, and custom fine-tuned models.",
    requirements: [
      "Strong background in LLM prompt engineering and agentic systems",
      "Experience with LangChain, LangGraph, or similar frameworks",
      "Familiarity with evaluation frameworks for AI accuracy",
      "Security domain knowledge is a strong plus",
    ],
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.06)",
    border: "rgba(255,61,154,0.15)",
  },
  {
    id: 4,
    title: "Developer Advocate",
    team: "Growth",
    type: "Full-time",
    location: "Remote (Americas / EMEA)",
    description: "Be the face of AuditSmart in the developer community. Write tutorials, speak at conferences, create content, and build relationships with DeFi protocols.",
    requirements: [
      "Active presence in the Web3 / Solidity developer community",
      "Strong technical writing and communication skills",
      "Experience creating developer-focused content (blog, video, workshops)",
      "Understanding of smart contract development and security basics",
    ],
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.06)",
    border: "rgba(0,255,148,0.15)",
  },
];

export default function CareersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(123,47,255,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(0,255,148,0.08)", border: "1px solid rgba(0,255,148,0.2)", color: "var(--brand-green)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--brand-green)", boxShadow: "0 0 6px var(--brand-green)" }}
            />
            4 Open Positions
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
            Build the security
            <br />layer for Web3.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
            We&apos;re a small, fully-remote team on a mission to make smart contract exploits rare. Join us and work on problems that actually matter.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 px-4 sm:px-6" style={{ background: "var(--surface-1)" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-10"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Why AuditSmart
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="rounded-xl p-5"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: perk.bg }}
                  >
                    <Icon size={18} style={{ color: perk.color }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{perk.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{perk.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-10"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Open Positions
          </h2>
          <div className="space-y-5">
            {JOBS.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl p-6 transition-all"
                style={{
                  background: "var(--surface-1)",
                  border: `1px solid ${job.border}`,
                  boxShadow: `inset 0 0 0 1px transparent`,
                }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: job.bg, color: job.color }}
                      >
                        {job.team}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>·</span>
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <Clock size={9} /> {job.type}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <MapPin size={9} /> {job.location}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{job.title}</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>{job.description}</p>
                    <div>
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Requirements</p>
                      <ul className="space-y-1">
                        {job.requirements.map((req) => (
                          <li key={req} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                            <span style={{ color: job.color, marginTop: 1, flexShrink: 0 }}>→</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <a
                    href={`mailto:careers@auditsmart.org?subject=Application: ${job.title}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${job.color}, var(--brand))` }}
                  >
                    Apply Now <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* General application */}
          <div
            className="mt-8 rounded-2xl p-6 text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Don&apos;t see your role?</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              We&apos;re always interested in exceptional people. Send us a note about who you are and what you&apos;d build here.
            </p>
            <a
              href="mailto:careers@auditsmart.org?subject=General Application"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border-strong)",
                background: "var(--elevated)",
              }}
            >
              Send an Open Application <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
