import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Users, MessageSquare, ExternalLink, ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Community",
  description: "Join the AuditSmart community — connect with smart contract security researchers and DeFi developers.",
};

const CHANNELS = [
  {
    icon: MessageSquare,
    name: "Discord",

    desc: "Real-time discussions, audit help, and security research. The most active AuditSmart community.",
    cta: "Join Discord",
    href: "https://discord.gg/auditsmart",
    badge: "Most active",
  },
  {
    icon: ExternalLink,
    name: "Twitter / X",
    desc: "Security alerts, exploit breakdowns, and platform updates. Follow us to stay informed.",
    cta: "Follow @auditsmart1",
    href: "https://twitter.com/auditsmart1",
    badge: null,
  },
  {
    icon: BookOpen,
    name: "Blog",
    desc: "Deep-dive research posts, post-mortems of major DeFi exploits, and developer guides.",
    cta: "Read the blog",
    href: "/blog",
    badge: null,
  },
];

const HIGHLIGHTS = [
  "Share audit reports and get community feedback",
  "Participate in vulnerability research discussions",
  "Learn from real exploit post-mortems",
  "Connect with other DeFi security professionals",
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Users className="w-3 h-3" />
            Community
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Join the AuditSmart community
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Connect with smart contract security researchers, DeFi developers, and auditors from around the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {CHANNELS.map(({ icon: Icon, name, desc, cta, href, badge }) => (
            <div key={name} className="flex flex-col p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{badge}</span>
                )}
              </div>
              <h2 className="font-semibold mb-2">{name}</h2>
              <p className="text-sm text-muted-foreground mb-5 flex-1">{desc}</p>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline underline-offset-2"
              >
                {cta} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="p-8 rounded-2xl border border-border bg-card">
          <h2 className="text-xl font-semibold mb-6">What the community offers</h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
