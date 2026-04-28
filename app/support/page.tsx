import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HelpCircle, Mail, MessageSquare, BookOpen, ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with AuditSmart — documentation, email support, and community resources.",
};

const FAQ = [
  {
    q: "How accurate are AuditSmart's reports?",
    a: "Our multi-agent system (Claude Opus + Groq + Gemini) achieves 56%+ detection rate on known vulnerability benchmarks. Always complement AI audits with manual review before mainnet deployment.",
  },
  {
    q: "What contract types are supported?",
    a: "AuditSmart supports Solidity smart contracts (EVM-compatible chains). We are working on Vyper and Rust (Solana) support.",
  },
  {
    q: "How long does an audit take?",
    a: "Most audits complete in under 60 seconds. Large contracts with 1,000+ lines may take up to 3 minutes.",
  },
  {
    q: "Can I re-run an audit after making changes?",
    a: "Yes. Each audit submission is independent. You can submit updated contract code at any time.",
  },
  {
    q: "How do I get my API key?",
    a: "Go to Dashboard → Settings → API Keys. API access is available on paid plans.",
  },
  {
    q: "I was charged but my audit failed. What do I do?",
    a: "Contact billing@auditsmart.org with your transaction ID. Failed audits that consume credits are refunded.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <HelpCircle className="w-3 h-3" />
            Support
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">How can we help?</h1>
          <p className="text-lg text-muted-foreground">Find answers or reach our team directly.</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            { icon: Mail, label: "Email support", sub: "hello@auditsmart.org", href: "mailto:hello@auditsmart.org" },
            { icon: MessageSquare, label: "Discord community", sub: "discord.gg/auditsmart", href: "https://discord.gg/auditsmart" },
            { icon: BookOpen, label: "Documentation", sub: "docs & guides", href: "/docs" },
          ].map(({ icon: Icon, label, sub, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center text-center gap-2 p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary" />
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </a>
          ))}
        </div>

        {/* Response time note */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-12 p-4 rounded-lg border border-border bg-muted/30">
          <Clock className="w-4 h-4 shrink-0" />
          Typical email response time: within 24 hours on business days.
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-semibold mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          Didn&apos;t find what you&apos;re looking for?{" "}
          <Link href="/contact" className="text-primary underline underline-offset-2">Contact us</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
