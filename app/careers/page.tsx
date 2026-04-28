import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Briefcase, Mail, Globe, Zap, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work at AuditSmart — help us secure the decentralized future. Open roles in security research and engineering.",
};

const VALUES = [
  { icon: Shield, label: "Security-first culture" },
  { icon: Zap, label: "Fast-paced, high-impact work" },
  { icon: Globe, label: "Fully remote team" },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Briefcase className="w-3 h-3" />
            Careers
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Work at AuditSmart</h1>
          <p className="text-lg text-muted-foreground">
            We&apos;re a small, focused team building the future of smart contract security.
            If you&apos;re passionate about DeFi, AI, and security — we want to hear from you.
          </p>
        </div>

        {/* Values */}
        <div className="flex flex-wrap gap-3 mb-16">
          {VALUES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm">
              <Icon className="w-3.5 h-3.5 text-primary" />
              {label}
            </div>
          ))}
        </div>

        {/* Open roles */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Open positions</h2>
          <div className="p-8 rounded-2xl border border-border bg-card text-center">
            <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">No open positions right now.</p>
            <p className="text-sm text-muted-foreground">
              We hire opportunistically. If you&apos;re exceptional, reach out anyway.
            </p>
          </div>
        </section>

        {/* Speculative applications */}
        <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <h2 className="text-xl font-semibold mb-3">Don&apos;t see a role that fits?</h2>
          <p className="text-muted-foreground mb-5 text-sm">
            We&apos;re always interested in exceptional smart contract security researchers, Solidity engineers,
            and AI engineers. Send us a note with what you&apos;re working on.
          </p>
          <a
            href="mailto:careers@auditsmart.org"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            careers@auditsmart.org
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
