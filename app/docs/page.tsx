import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookOpen, Zap, Code2, Shield, ArrowRight, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description: "AuditSmart documentation — learn how to use the platform, integrate the API, and get the most from AI-powered smart contract auditing.",
};

const SECTIONS = [
  {
    icon: Zap,
    title: "Getting Started",
    desc: "Create an account, run your first audit, and understand your report in under 5 minutes.",
    links: [
      { label: "Quickstart guide", href: "/docs/quickstart" },
      { label: "Understanding your audit report", href: "/docs/reports" },
      { label: "Supported contract types", href: "/docs/contracts" },
    ],
  },
  {
    icon: Code2,
    title: "API Reference",
    desc: "Integrate AuditSmart directly into your CI/CD pipeline or development workflow.",
    links: [
      { label: "API overview", href: "/docs/api" },
      { label: "Authentication", href: "/docs/api#auth" },
      { label: "Submit a contract", href: "/docs/api#submit" },
    ],
  },
  {
    icon: Shield,
    title: "Vulnerability Guide",
    desc: "Reference for every vulnerability class AuditSmart detects, with code examples and remediation advice.",
    links: [
      { label: "Reentrancy", href: "/docs/vulnerabilities/reentrancy" },
      { label: "Access control", href: "/docs/vulnerabilities/access-control" },
      { label: "Integer overflow", href: "/docs/vulnerabilities/overflow" },
    ],
  },
  {
    icon: Terminal,
    title: "Integrations",
    desc: "Connect AuditSmart to Hardhat, Foundry, GitHub Actions, and more.",
    links: [
      { label: "GitHub Actions", href: "/docs/integrations/github-actions" },
      { label: "Hardhat plugin", href: "/docs/integrations/hardhat" },
      { label: "Foundry integration", href: "/docs/integrations/foundry" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <BookOpen className="w-3 h-3" />
            Documentation
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to get the most out of AuditSmart — from your first audit to full API integration.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-16">
          <Link href="/docs/api" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Code2 className="w-4 h-4" /> API Reference <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href="/register" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:border-primary/40 transition-colors">
            <Zap className="w-4 h-4" /> Start auditing free
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SECTIONS.map(({ icon: Icon, title, desc, links }) => (
            <div key={title} className="p-6 rounded-xl border border-border bg-card">
              <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{desc}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2">
                      <ArrowRight className="w-3 h-3" /> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
