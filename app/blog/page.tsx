import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PenTool, ArrowRight, Shield, Zap, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Smart contract security research, exploit post-mortems, and DeFi security insights from the AuditSmart team.",
};

const POSTS = [
  {
    tag: "Research",
    tagIcon: Shield,
    title: "The Top 10 Smart Contract Vulnerability Classes in 2025",
    excerpt: "Reentrancy is old news. We analyzed 200+ DeFi exploits to identify the vulnerability patterns that are still catching developers off guard.",
    date: "Apr 20, 2025",
    readTime: "8 min read",
    slug: "top-10-smart-contract-vulnerabilities-2025",
  },
  {
    tag: "Post-Mortem",
    tagIcon: Zap,
    title: "How a Missing Access Control Check Cost $14M",
    excerpt: "Breaking down a recent DeFi exploit where a single missing `onlyOwner` modifier led to a complete protocol drain — and how AuditSmart's agents would have caught it.",
    date: "Apr 12, 2025",
    readTime: "6 min read",
    slug: "access-control-exploit-post-mortem",
  },
  {
    tag: "Guide",
    tagIcon: BookOpen,
    title: "Writing Auditable Solidity: A Developer's Checklist",
    excerpt: "35 patterns and anti-patterns that separate contracts that get exploited from ones that don't. A practical guide for Solidity developers.",
    date: "Apr 5, 2025",
    readTime: "12 min read",
    slug: "writing-auditable-solidity-checklist",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <PenTool className="w-3 h-3" />
            Blog
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Security research & insights</h1>
          <p className="text-lg text-muted-foreground">
            Deep dives into smart contract vulnerabilities, DeFi exploit post-mortems, and practical security guidance.
          </p>
        </div>

        <div className="space-y-6">
          {POSTS.map(({ tag, tagIcon: Icon, title, excerpt, date, readTime, slug }) => (
            <article key={slug} className="group p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">{tag}</span>
                <span className="text-xs text-muted-foreground ml-auto">{date} · {readTime}</span>
              </div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{excerpt}</p>
              <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Read more <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-border bg-card text-center">
          <h2 className="text-xl font-semibold mb-2">Stay ahead of exploits</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Get new research posts and security alerts delivered to your inbox.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Subscribe <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
