import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, MessageSquare, ExternalLink, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the AuditSmart team for support, partnerships, or security inquiries.",
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    desc: "For general inquiries and partnerships",
    value: "hello@auditsmart.org",
    href: "mailto:hello@auditsmart.org",
  },
  {
    icon: MessageSquare,
    title: "Support",
    desc: "Having trouble with an audit or your account?",
    value: "support@auditsmart.org",
    href: "mailto:support@auditsmart.org",
  },
  {
    icon: ExternalLink,
    title: "Twitter / X",
    desc: "Follow for updates and security research",
    value: "@auditsmart1",
    href: "https://twitter.com/auditsmart1",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Send className="w-3 h-3" />
            Contact Us
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Get in touch</h1>
          <p className="text-muted-foreground text-lg">
            Have a question, a partnership idea, or need help? We&apos;re here.
          </p>
        </div>

        {/* Contact channels */}
        <div className="space-y-4 mb-16">
          {CHANNELS.map(({ icon: Icon, title, desc, value, href }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-5 p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors group"
            >
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
                <div className="text-sm text-primary mt-1">{value}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Security issues note */}
        <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <h2 className="font-semibold mb-2">Reporting a security vulnerability?</h2>
          <p className="text-sm text-muted-foreground">
            If you&apos;ve discovered a security issue in AuditSmart itself, please follow our responsible disclosure process.{" "}
            <Link href="/security" className="text-primary underline underline-offset-2">
              View our security policy
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
