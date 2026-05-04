"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, ChevronDown, ChevronRight, Shield, Zap, CreditCard, Settings, BookOpen, MessageSquare } from "lucide-react";

const CATEGORIES = [
  {
    icon: Shield,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "Getting Started",
    desc: "New to AuditSmart? Start here.",
    count: 6,
    id: "getting-started",
  },
  {
    icon: Zap,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Running Audits",
    desc: "How to scan, interpret results, and download reports.",
    count: 9,
    id: "running-audits",
  },
  {
    icon: CreditCard,
    color: "var(--brand-green)",
    bg: "rgba(0,255,148,0.08)",
    title: "Billing & Plans",
    desc: "Subscriptions, payments, and refunds.",
    count: 7,
    id: "billing",
  },
  {
    icon: Settings,
    color: "var(--brand-pink)",
    bg: "rgba(255,61,154,0.08)",
    title: "Account & Settings",
    desc: "Manage your profile, API keys, and security.",
    count: 5,
    id: "account",
  },
  {
    icon: BookOpen,
    color: "var(--brand)",
    bg: "rgba(0,212,255,0.08)",
    title: "API & Integrations",
    desc: "Developer API, webhooks, and CI/CD setup.",
    count: 8,
    id: "api",
  },
  {
    icon: MessageSquare,
    color: "var(--brand-purple)",
    bg: "rgba(123,47,255,0.08)",
    title: "Troubleshooting",
    desc: "Common issues and how to resolve them.",
    count: 11,
    id: "troubleshooting",
  },
];

const FAQS = [
  {
    category: "getting-started",
    q: "How do I run my first audit?",
    a: "Register for a free account, navigate to the Dashboard, and click 'Scan Contract'. Paste your Solidity code into the editor and click 'Run Audit'. Results appear within 60 seconds.",
  },
  {
    category: "getting-started",
    q: "What Solidity versions does AuditSmart support?",
    a: "AuditSmart supports all Solidity versions from 0.4.x through the latest 0.8.x. You don't need to specify the version — we auto-detect it from your pragma statement.",
  },
  {
    category: "getting-started",
    q: "Is my contract code stored on your servers?",
    a: "No. Your contract source code is analyzed in-memory and immediately discarded. We only retain a SHA-256 hash of the contract for report verification. See our Privacy Policy for full details.",
  },
  {
    category: "getting-started",
    q: "How accurate is the analysis?",
    a: "Our multi-agent pipeline achieves a 56%+ detection rate across standard vulnerability classes. For critical vulnerabilities in our training distribution, accuracy is significantly higher. We recommend pairing AuditSmart with a manual review for high-value contracts.",
  },
  {
    category: "running-audits",
    q: "What's the difference between a Standard Audit and a Deep Audit?",
    a: "Standard Audits run our 10-agent pipeline (8 Groq LLaMA agents + Gemini + Slither) and complete in under 60 seconds. Deep Audits additionally use Claude Opus with extended thinking mode, providing full exploit proof-of-concepts, production-ready patched code, and a deployment verdict. Deep Audits take 3-5 minutes.",
  },
  {
    category: "running-audits",
    q: "What vulnerability types do you detect?",
    a: "We detect reentrancy, integer overflow/underflow, access control issues, logic errors, gas/DoS vectors, DeFi-specific attacks (flash loans, price manipulation), backdoors (selfdestruct, delegatecall), and signature validation errors. Each finding includes severity, description, and fix code.",
  },
  {
    category: "running-audits",
    q: "Can I download my audit report as a PDF?",
    a: "Yes. Every audit generates a branded PDF report with executive summary, severity breakdown, detailed findings, and fix code. You can download it from the audit results page or share a public link.",
  },
  {
    category: "running-audits",
    q: "Why did my audit return zero findings?",
    a: "A clean result means our agents found no vulnerabilities matching our detection patterns. This doesn't guarantee the contract is safe — no automated tool is 100% complete. For production contracts, always supplement with a manual review.",
  },
  {
    category: "billing",
    q: "How does the 3-day free trial work?",
    a: "When you start a trial, you get full access to the selected paid plan for 3 days at $0. Your card is saved but not charged. On day 4, it automatically converts to a paid subscription. Cancel before day 4 from your Billing settings to avoid charges.",
  },
  {
    category: "billing",
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Dashboard → Billing → Cancel Plan. Cancellation takes effect at the end of your current billing period. You retain access until then.",
  },
  {
    category: "billing",
    q: "Do unused audits roll over to the next month?",
    a: "No. Audit credits reset at the start of each billing cycle. If you consistently need more audits, consider upgrading to a higher plan.",
  },
  {
    category: "billing",
    q: "What payment methods are accepted?",
    a: "We accept credit cards, debit cards, UPI, and net banking via Razorpay. All payments are secured by Razorpay's PCI-DSS compliant infrastructure.",
  },
  {
    category: "account",
    q: "How do I change my password?",
    a: "Go to Dashboard → Settings → Security. Enter your current password and your new password. If you've forgotten your password, use the 'Forgot Password' link on the login page.",
  },
  {
    category: "account",
    q: "How do I generate an API key?",
    a: "Go to Dashboard → Settings → API Keys → Generate New Key. Give it a descriptive name and copy it immediately — it won't be shown again. Keys can be revoked at any time.",
  },
  {
    category: "api",
    q: "Is there a rate limit on the API?",
    a: "Yes. API rate limits match your plan: Free (10 req/min), Pro (60 req/min), Enterprise (200 req/min). Rate limit headers are included in all API responses.",
  },
  {
    category: "api",
    q: "Can I integrate AuditSmart into my CI/CD pipeline?",
    a: "Yes. Use our REST API to trigger audits programmatically. We provide a GitHub Actions example in our documentation. The API returns findings in JSON format that your pipeline can act on.",
  },
  {
    category: "troubleshooting",
    q: "My audit is taking longer than 60 seconds. What's happening?",
    a: "Standard audits complete in under 60 seconds for most contracts. Very large contracts (2,000+ lines) may take up to 90 seconds. If your audit hasn't completed after 2 minutes, try refreshing. If the issue persists, contact support.",
  },
  {
    category: "troubleshooting",
    q: "I'm getting a 'compilation error' in my audit. What does that mean?",
    a: "This usually means your Solidity code has a syntax error or missing import. Check that your contract compiles successfully in Remix or Hardhat before submitting. Make sure to include all relevant contract code, not just the vulnerable function.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-all"
        style={{ background: open ? "var(--elevated)" : "var(--surface-1)" }}
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{q}</span>
        {open
          ? <ChevronDown size={16} style={{ color: "var(--brand)", flexShrink: 0 }} />
          : <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div
          className="px-5 pb-4 text-sm leading-relaxed"
          style={{ color: "var(--text-muted)", background: "var(--elevated)", borderTop: "1px solid var(--border)" }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = FAQS.filter((faq) => {
    const matchQuery = !query || faq.q.toLowerCase().includes(query.toLowerCase()) || faq.a.toLowerCase().includes(query.toLowerCase());
    const matchCategory = !activeCategory || faq.category === activeCategory;
    return matchQuery && matchCategory;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Help Center
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--text-muted)" }}>
            Answers to the most common questions about AuditSmart.
          </p>
          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search for answers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-3 pl-11 pr-4 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "'Satoshi', sans-serif",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        {/* Category grid */}
        {!query && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className="text-left rounded-xl p-4 transition-all"
                  style={{
                    background: active ? cat.bg : "var(--surface-1)",
                    border: `1px solid ${active ? cat.color + "55" : "var(--border)"}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: cat.bg }}
                  >
                    <Icon size={16} style={{ color: cat.color }} />
                  </div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{cat.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{cat.count} articles</div>
                </button>
              );
            })}
          </div>
        )}

        {/* FAQs */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {query ? `Results for "${query}"` : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.title : "All Questions"}
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-muted)" }}>({filtered.length})</span>
            </h2>
            {(query || activeCategory) && (
              <button
                onClick={() => { setQuery(""); setActiveCategory(null); }}
                className="text-xs font-semibold"
                style={{ color: "var(--brand)" }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <Search size={28} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
              <p className="font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>No results found</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Try different keywords or browse by category above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          )}
        </div>

        {/* Still need help */}
        <div
          className="mt-14 rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(123,47,255,0.06), rgba(0,212,255,0.04))",
            border: "1px solid var(--border)",
          }}
        >
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Still need help?</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Our support team typically responds within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--brand-purple), var(--brand))" }}
            >
              Open a Support Ticket
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border-strong)", background: "var(--elevated)" }}
            >
              Ask the Community
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
