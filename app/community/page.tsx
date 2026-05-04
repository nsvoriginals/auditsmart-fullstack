"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Users, MessageSquare, BookOpen, Trophy, Star, Zap } from "lucide-react";
import { FaDiscord, FaTelegram, FaTwitter, FaGithub } from "react-icons/fa";

const CHANNELS = [
  {
    icon: FaDiscord,
    name: "Discord",
    members: "3,200+",
    desc: "Our most active community. Get help, share findings, discuss security research, and chat with the team.",
    href: "https://discord.gg/BHJNbEtxC",
    color: "#5865F2",
    bg: "rgba(88,101,242,0.08)",
    border: "rgba(88,101,242,0.2)",
    cta: "Join Discord",
  },
  {
    icon: FaTelegram,
    name: "Telegram",
    members: "1,800+",
    desc: "Quick updates, security alerts, and community announcements. Great for staying in the loop on the go.",
    href: "https://t.me/auditsmart1",
    color: "#26A5E4",
    bg: "rgba(38,165,228,0.08)",
    border: "rgba(38,165,228,0.2)",
    cta: "Join Telegram",
  },
  {
    icon: FaTwitter,
    name: "Twitter / X",
    members: "5,600+",
    desc: "Latest vulnerability reports, product updates, and security tips from our research team.",
    href: "https://x.com/auditsmart1",
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.15)",
    cta: "Follow Us",
  },
  {
    icon: FaGithub,
    name: "GitHub",
    members: "480+",
    desc: "Open issues, contribute to our detection rules, and explore our public security research repositories.",
    href: "https://github.com/auditsmart",
    color: "var(--text-secondary)",
    bg: "var(--elevated)",
    border: "var(--border)",
    cta: "View GitHub",
  },
];

const HIGHLIGHTS = [
  {
    icon: Trophy,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Monthly CTF Challenges",
    desc: "Sharpen your skills with monthly Solidity CTF challenges. Top solvers earn AuditSmart credits and community recognition.",
  },
  {
    icon: BookOpen,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Security Research Library",
    desc: "Community-curated collection of audit reports, exploit analyses, and best practices. Continuously updated by members.",
  },
  {
    icon: MessageSquare,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Audit Review Sessions",
    desc: "Weekly voice sessions where security researchers review submitted contracts and explain their findings live.",
  },
  {
    icon: Star,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Contributor Program",
    desc: "Write security tutorials, contribute detection patterns, or help build community resources. Earn rewards and recognition.",
  },
];

const RECENT_DISCUSSIONS = [
  { title: "Weird delegatecall behavior in proxy contracts — need a second pair of eyes", author: "0xdev_kobi", replies: 12, channel: "#smart-contract-help" },
  { title: "My analysis of the recent Euler Finance exploit", author: "security_anon", replies: 34, channel: "#research" },
  { title: "Is integer overflow still a real risk post-0.8?", author: "solidity_builder", replies: 8, channel: "#general" },
  { title: "AuditSmart correctly caught the reentrancy my manual review missed", author: "defi_marc", replies: 19, channel: "#feedback" },
  { title: "Guide: Setting up Foundry + AuditSmart CI in your workflow", author: "web3_yuki", replies: 27, channel: "#tutorials" },
];

export default function CommunityPage() {
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
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(123,47,255,0.12), rgba(0,212,255,0.10))",
              border: "1px solid rgba(123,47,255,0.2)",
            }}
          >
            <Users size={28} style={{ color: "var(--brand-purple)" }} />
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
            Join the Community
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
            10,000+ developers, security researchers, and DeFi builders sharing knowledge and making Web3 safer together.
          </p>
        </div>
      </section>

      {/* Community Channels */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl p-6 flex flex-col transition-all"
                  style={{
                    background: ch.bg,
                    border: `1px solid ${ch.border}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon size={22} style={{ color: ch.color }} />
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>{ch.name}</span>
                    <span
                      className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
                    >
                      {ch.members}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--text-muted)" }}>
                    {ch.desc}
                  </p>
                  <div
                    className="inline-flex items-center gap-2 text-sm font-bold"
                    style={{ color: ch.color }}
                  >
                    {ch.cta} <ArrowRight size={14} />
                  </div>
                </a>
              );
            })}
          </div>

          {/* Highlights */}
          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8 text-center"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Community Programs
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.title}
                  className="rounded-xl p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: h.bg }}
                  >
                    <Icon size={18} style={{ color: h.color }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{h.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{h.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Recent Discussions */}
          <h2
            className="text-2xl font-extrabold tracking-tight mb-6"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            Recent Discussions
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {RECENT_DISCUSSIONS.map((d, i) => (
              <div
                key={d.title}
                className="flex items-start gap-4 px-5 py-4"
                style={{
                  background: i % 2 === 0 ? "var(--surface-1)" : "var(--background)",
                  borderBottom: i < RECENT_DISCUSSIONS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--elevated)", color: "var(--brand)" }}
                >
                  {d.author[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{d.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.author}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: "var(--brand)", background: "var(--brand-faint)" }}
                    >
                      {d.channel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  <MessageSquare size={11} />
                  {d.replies}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://discord.gg/BHJNbEtxC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
            >
              <Zap size={14} /> Join the Conversation
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
