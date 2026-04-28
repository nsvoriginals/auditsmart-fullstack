import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Zap, Users, Globe, ArrowRight, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about AuditSmart — the AI-powered smart contract security platform built to protect DeFi protocols.",
};

const TEAM = [
  { name: "Security Research", desc: "Deep expertise in EVM bytecode, reentrancy, and DeFi attack vectors." },
  { name: "AI Engineering", desc: "Multi-model orchestration using Claude, Groq, and Gemini for maximum detection coverage." },
  { name: "Blockchain Development", desc: "Battle-tested Solidity developers who understand what makes contracts break." },
];

const VALUES = [
  { icon: Shield, title: "Security First", desc: "Every decision we make is evaluated through a security lens. No shortcuts." },
  { icon: Zap, title: "Speed Without Compromise", desc: "Audits in under 60 seconds — without sacrificing depth or accuracy." },
  { icon: Users, title: "Community Driven", desc: "We share findings, tools, and knowledge openly with the security community." },
  { icon: Globe, title: "DeFi Native", desc: "Built by people who use, build, and secure DeFi protocols every day." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        {/* Hero */}
        <div className="mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Shield className="w-3 h-3" />
            About AuditSmart
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Securing the decentralized future,{" "}
            <span className="text-primary">one contract at a time</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            AuditSmart is a production-grade smart contract security platform powered by a multi-agent AI system.
            We combine Claude Opus, Groq LLaMA, and Gemini to deliver comprehensive vulnerability detection
            that rivals traditional manual audits — in under 60 seconds.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-20 p-8 rounded-2xl border border-border bg-card">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            Over $3 billion has been lost to smart contract exploits. Most of these attacks exploited
            well-known vulnerability classes — reentrancy, integer overflow, access control failures —
            that a thorough audit would have caught. We built AuditSmart to make that level of scrutiny
            accessible to every developer, not just protocols with six-figure security budgets.
          </p>
        </section>

        {/* Values */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-10">What we stand for</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                <Icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-4">The team</h2>
          <p className="text-muted-foreground mb-8">
            AuditSmart is built by a cross-functional team combining deep security research,
            AI systems engineering, and blockchain development.
          </p>
          <div className="space-y-4">
            {TEAM.map(({ name, desc }) => (
              <div key={name} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <span className="font-medium">{name}</span>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center">
          <h2 className="text-2xl font-semibold mb-3">Ready to secure your contracts?</h2>
          <p className="text-muted-foreground mb-6">Start for free. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
              Contact us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
