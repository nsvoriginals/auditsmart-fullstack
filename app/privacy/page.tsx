"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, including:

**Account Information:** When you register, we collect your name, email address, and password (stored as a secure hash). You may also choose to authenticate via GitHub or Google OAuth, in which case we receive basic profile data from those providers.

**Payment Information:** If you purchase a paid plan, payment is processed by Razorpay. We do not store your full card details. We receive a payment token and transaction ID from Razorpay for our records.

**Usage Data:** We log which features you use, audit history (metadata only), and performance metrics to improve the platform.

**Contract Data:** Smart contract code you submit is analyzed in-memory and immediately discarded. We retain only a SHA-256 hash of the contract for report verification purposes. We never store your raw contract source code.`,
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

- Provide, maintain, and improve AuditSmart services
- Process transactions and send transaction confirmations
- Send security advisories and product updates (you can opt out at any time)
- Respond to your comments and questions
- Monitor and analyze usage patterns to improve the platform
- Detect and prevent fraud and abuse
- Comply with legal obligations

We do not sell, rent, or share your personal information with third parties for their marketing purposes.`,
  },
  {
    id: "data-storage",
    title: "3. Data Storage & Security",
    content: `**Contract Code:** Never stored. Only a SHA-256 hash is retained for report integrity verification.

**Account Data:** Stored in encrypted MongoDB databases hosted on cloud infrastructure with SOC 2 Type II certification.

**Passwords:** Bcrypt-hashed with a cost factor of 12. Plain-text passwords are never stored or logged.

**Data Retention:** Account data is retained as long as your account is active. You may request deletion at any time by contacting privacy@auditsmart.org. We will process deletion requests within 30 days.

**Encryption:** All data in transit is protected by TLS 1.3. Sensitive fields at rest are encrypted using AES-256.`,
  },
  {
    id: "cookies",
    title: "4. Cookies & Tracking",
    content: `We use the following types of cookies:

**Essential Cookies:** Required for authentication sessions and core functionality. Cannot be disabled.

**Analytics Cookies:** We use Vercel Analytics to understand how visitors interact with our site. This data is anonymized and does not personally identify you.

**Preference Cookies:** Store your theme preference (dark/light mode) and other UI settings.

We do not use third-party advertising cookies or behavioral tracking. You can manage cookie preferences in your browser settings.`,
  },
  {
    id: "third-parties",
    title: "5. Third-Party Services",
    content: `AuditSmart integrates with these third-party services, each with their own privacy policies:

- **Razorpay** — Payment processing (razorpay.com/privacy)
- **Google** — OAuth authentication (policies.google.com/privacy)
- **GitHub** — OAuth authentication (docs.github.com/site-policy/privacy-policies)
- **Resend** — Transactional email delivery
- **Upstash** — Rate limiting and caching (Redis)
- **Vercel** — Hosting and analytics

We share only the minimum information necessary for these services to function.`,
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    content: `Depending on your location, you may have the following rights under GDPR, CCPA, or other applicable laws:

- **Access:** Request a copy of all personal data we hold about you
- **Rectification:** Correct inaccurate or incomplete data
- **Erasure:** Request deletion of your personal data
- **Portability:** Receive your data in a machine-readable format
- **Objection:** Object to processing of your data for marketing purposes
- **Restriction:** Request that we limit how we use your data

To exercise any of these rights, contact us at privacy@auditsmart.org. We will respond within 30 days.`,
  },
  {
    id: "children",
    title: "7. Children's Privacy",
    content: `AuditSmart is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you believe we have inadvertently collected information from a child, please contact us immediately at privacy@auditsmart.org and we will delete the information promptly.`,
  },
  {
    id: "changes",
    title: "8. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a prominent notice on our platform at least 30 days before changes take effect. Your continued use of AuditSmart after the effective date constitutes acceptance of the updated policy.

The &quot;Last Updated&quot; date at the top of this page indicates when the policy was last revised.`,
  },
  {
    id: "contact",
    title: "9. Contact Us",
    content: `For privacy-related questions or to exercise your rights, contact our Data Protection Officer:

**Email:** privacy@auditsmart.org
**Response time:** Within 30 days

For general inquiries, visit our [Contact page](/contact) or email hello@auditsmart.org.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Satoshi', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 sm:px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-2xl mx-auto relative">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)" }}
          >
            <Shield size={22} style={{ color: "var(--brand)" }} />
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Last updated: January 1, 2025 &nbsp;·&nbsp; Effective: January 1, 2025
          </p>
          <p className="text-base mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Your privacy is fundamental to how we build AuditSmart. We collect the minimum data necessary and never sell it.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid md:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar TOC */}
        <aside className="hidden md:block">
          <nav className="sticky top-24 rounded-2xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-disabled)" }}>
              Contents
            </p>
            <ul className="space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--brand)"; (e.currentTarget as HTMLElement).style.background = "var(--brand-faint)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <ChevronRight size={10} />
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {/* Summary card */}
          <div
            className="rounded-2xl p-6 mb-10"
            style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--brand)" }}>TL;DR — The Short Version</h2>
            <ul className="space-y-2">
              {[
                "We never store your smart contract source code — only a SHA-256 hash.",
                "We don't sell your data to anyone, ever.",
                "Passwords are bcrypt-hashed. We can't read them.",
                "You can delete your account and all data at any time.",
                "We use Razorpay for payments — your card details never touch our servers.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--brand-green)", marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2
                  className="text-xl font-bold mb-4 pb-3"
                  style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}
                >
                  {section.title}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {section.content.split("\n\n").map((para, i) => (
                    <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">
                      {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j} style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
