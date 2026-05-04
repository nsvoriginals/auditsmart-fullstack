"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";

const FEATURED = {
  slug: "top-10-solidity-vulnerabilities-2025",
  category: "Security Research",
  categoryColor: "var(--brand)",
  categoryBg: "rgba(0,212,255,0.08)",
  title: "Top 10 Solidity Vulnerabilities Found in DeFi Protocols — 2025 Edition",
  excerpt: "After analyzing over 10,000 smart contracts, we compiled the most common and most dangerous vulnerability patterns. Reentrancy still leads the pack, but new DeFi-specific attack vectors are surging.",
  author: "Marcus Webb",
  authorRole: "Head of Security Research",
  date: "May 1, 2025",
  readTime: "12 min read",
  tags: ["Solidity", "DeFi", "Vulnerabilities"],
};

const POSTS = [
  {
    slug: "understanding-reentrancy-attacks",
    category: "Deep Dive",
    categoryColor: "var(--brand-purple)",
    categoryBg: "rgba(123,47,255,0.08)",
    title: "Understanding Reentrancy: From The DAO Hack to Modern Exploits",
    excerpt: "The DAO hack in 2016 changed Ethereum forever. 9 years later, reentrancy is still the #1 vulnerability we find. Here's why it keeps coming back.",
    author: "Alex Chen",
    date: "Apr 24, 2025",
    readTime: "9 min read",
  },
  {
    slug: "access-control-vulnerabilities-in-defi",
    category: "Tutorial",
    categoryColor: "var(--brand-green)",
    categoryBg: "rgba(0,255,148,0.08)",
    title: "Access Control Vulnerabilities: The Mistake 40% of Contracts Make",
    excerpt: "Missing or incorrect access control is trivially easy to exploit but surprisingly common. We analyzed 5,000 contracts to find the most frequent patterns.",
    author: "Priya Sharma",
    date: "Apr 18, 2025",
    readTime: "7 min read",
  },
  {
    slug: "ai-vs-manual-audits",
    category: "Industry",
    categoryColor: "var(--brand-pink)",
    categoryBg: "rgba(255,61,154,0.08)",
    title: "AI Audits vs Manual Audits: An Honest Comparison",
    excerpt: "We ran 200 contracts through both AuditSmart and a manual audit firm. The results were surprising — and humbling. Here's what we learned.",
    author: "Alex Chen",
    date: "Apr 10, 2025",
    readTime: "11 min read",
  },
  {
    slug: "slither-integration-deep-dive",
    category: "Engineering",
    categoryColor: "var(--brand)",
    categoryBg: "rgba(0,212,255,0.08)",
    title: "How We Integrated Slither into Our Multi-Agent Pipeline",
    excerpt: "Slither is the gold standard for static analysis. Combining it with LLM-based agents required solving some interesting engineering challenges.",
    author: "Yuki Tanaka",
    date: "Apr 3, 2025",
    readTime: "8 min read",
  },
  {
    slug: "flash-loan-attacks-explained",
    category: "Deep Dive",
    categoryColor: "var(--brand-purple)",
    categoryBg: "rgba(123,47,255,0.08)",
    title: "Flash Loan Attacks: How $100M Was Stolen in 13 Seconds",
    excerpt: "Flash loans changed DeFi security forever. We break down how three major protocol exploits happened and what code patterns to avoid.",
    author: "Marcus Webb",
    date: "Mar 27, 2025",
    readTime: "14 min read",
  },
  {
    slug: "writing-secure-erc20-tokens",
    category: "Tutorial",
    categoryColor: "var(--brand-green)",
    categoryBg: "rgba(0,255,148,0.08)",
    title: "Writing a Secure ERC-20 Token: A Complete Checklist",
    excerpt: "Over 60% of tokens have at least one vulnerability. We wrote the definitive checklist for shipping ERC-20 tokens that won't get exploited.",
    author: "Priya Sharma",
    date: "Mar 20, 2025",
    readTime: "10 min read",
  },
];

const CATEGORIES = ["All", "Security Research", "Deep Dive", "Tutorial", "Engineering", "Industry"];

export default function BlogPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(123,47,255,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{
              background: "linear-gradient(135deg, var(--text-primary) 40%, var(--brand-purple) 80%, var(--brand))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
            }}
          >
            Security Insights
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            In-depth research, tutorials, and analysis from the AuditSmart security team.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: i === 0 ? "linear-gradient(135deg, var(--brand-purple), var(--brand))" : "var(--elevated)",
                color: i === 0 ? "white" : "var(--text-muted)",
                border: `1px solid ${i === 0 ? "transparent" : "var(--border)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div
          className="rounded-2xl p-7 mb-10 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(123,47,255,0.08), rgba(0,212,255,0.05))",
            border: "1px solid rgba(123,47,255,0.2)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: FEATURED.categoryBg, color: FEATURED.categoryColor }}
              >
                {FEATURED.category}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: "rgba(0,212,255,0.08)", color: "var(--brand)", border: "1px solid rgba(0,212,255,0.15)" }}
              >
                Featured
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 leading-tight"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
            >
              {FEATURED.title}
            </h2>
            <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: "var(--text-muted)" }}>
              {FEATURED.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--elevated)", color: "var(--brand)" }}
                >
                  {FEATURED.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{FEATURED.author}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{FEATURED.authorRole}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1"><Calendar size={10} />{FEATURED.date}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{FEATURED.readTime}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/blog/${FEATURED.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
              >
                Read Article <ArrowRight size={14} />
              </Link>
              <div className="flex gap-2">
                {FEATURED.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded" style={{ color: "var(--text-disabled)", background: "var(--elevated)" }}>
                    <Tag size={8} />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Post Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl p-5 flex flex-col transition-all"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span
                className="self-start text-[10px] font-bold px-2.5 py-1 rounded-full mb-4"
                style={{ background: post.categoryBg, color: post.categoryColor }}
              >
                {post.category}
              </span>
              <h3
                className="text-sm font-bold leading-snug mb-2 flex-1 group-hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {post.title}
              </h3>
              <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "var(--elevated)", color: "var(--brand)" }}
                  >
                    {post.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{post.author}</span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Load more */}
        <div className="text-center mt-10">
          <button
            className="px-8 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-strong)",
              background: "var(--elevated)",
            }}
          >
            Load More Articles
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
