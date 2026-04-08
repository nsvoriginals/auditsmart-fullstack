"use client";
// app/pricing/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import { Check, X, Sparkles, Zap, Shield, Crown, ArrowRight, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface ExtendedSession {
  user: { id: string; email: string; name?: string | null; role?: string; plan?: string; image?: string | null; }
}

const PLANS = [
  {
    id: "free", name: "Free", price: "₹0", period: "forever",
    description: "Try before you commit", icon: Shield,
    features: ["3 audits included", "Groq LLaMA + Gemini analysis", "PDF audit report", "Community support"],
    missing: ["Fix suggestions", "Exploit scenarios", "Claude AI models"],
    cta: "Start free", ctaHref: "/register", featured: false,
  },
  {
    id: "pro", name: "Pro", price: "₹2,900", period: "/month",
    description: "For active developers", icon: Zap,
    features: ["20 audits / month", "Groq + Claude Haiku", "PDF audit reports", "Fix suggestions with code", "Deployment verdict", "Email support"],
    missing: ["Exploit scenarios", "Claude Sonnet / Opus"],
    cta: "Upgrade to Pro", featured: true,
  },
  {
    id: "enterprise", name: "Enterprise", price: "₹4,900", period: "/month",
    description: "For teams shipping to mainnet", icon: Crown,
    features: ["50 audits / month", "Groq + Claude Sonnet", "PDF audit reports", "Fix suggestions with code", "Full exploit scenarios", "Deployment verdict", "API access", "Priority support"],
    missing: [], cta: "Upgrade to Enterprise", featured: false,
  },
];

const DEEP_AUDIT_FEATURES = [
  "Claude Opus — most powerful AI",
  "Extended thinking — full AI reasoning",
  "Full exploit PoC for every critical finding",
  "Production-ready patched code",
  "Deployment verdict: SAFE / CAUTION / DO NOT DEPLOY",
  "Priority processing",
];

const FAQS = [
  { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, debit cards, UPI, and net banking via Razorpay." },
  { q: "Is there a long-term contract?", a: "No, all plans are month-to-month. Cancel anytime with no hidden fees." },
  { q: "Do you offer team discounts?", a: "Yes, for Enterprise plans we offer volume discounts. Contact sales for a custom quote." },
];

const annualPrice = (p: string) => {
  const m = p.match(/₹([\d,]+)/); if (!m) return p;
  return `₹${(parseInt(m[1].replace(/,/g, "")) * 10).toLocaleString()}`;
};

export default function PricingPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const router = useRouter();
  const [paying, setPaying] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const handleUpgrade = async (planId: string) => {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    if (session.user?.plan === planId) { toast.info("You're already on this plan"); return; }
    setPaying(planId);
    try {
      if (!window.Razorpay) {
        const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; document.body.appendChild(s);
        await new Promise(r => { s.onload = r; });
      }
      const orderRes = await fetch("/api/payment/razorpay/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planId, interval: billingInterval }) });
      const order = await orderRes.json();
      if (!orderRes.ok) { toast.error(order.detail ?? "Order creation failed"); setPaying(null); return; }
      const rzp = new window.Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency, name: "AuditSmart",
        description: `${planId} Plan`, order_id: order.order_id, theme: { color: "#6366f1" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const ver = await fetch("/api/payment/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...response, plan: planId }) }).then(r => r.json());
          if (ver.status === "success") { toast.success(`Upgraded to ${planId}!`); setTimeout(() => router.push("/dashboard"), 1500); }
          else toast.error("Payment verification failed.");
        },
      });
      rzp.open();
    } catch { toast.error("Something went wrong."); }
    finally { setPaying(null); }
  };

  const card: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28, display: "flex", flexDirection: "column", position: "relative", boxShadow: "var(--shadow-card)", transition: "box-shadow 0.2s" };
  const featuredCard: React.CSSProperties = { ...card, border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 0 0 1px rgba(99,102,241,0.1), var(--shadow-card)" };
  const btnPrimary: React.CSSProperties = { width: "100%", padding: "11px 0", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontFamily: "'Satoshi', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
  const btnGhost: React.CSSProperties = { ...btnPrimary, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" };

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", color: "var(--text-primary)" }}>
      <Navbar />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--brand)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Satoshi', sans-serif", marginBottom: 18 }}>
            Pricing
          </div>
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(30px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 12 }}>Simple, transparent pricing</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.8, fontFamily: "'Satoshi', sans-serif" }}>
            Start free with 3 audits. Upgrade when your contracts need more protection.
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 4, gap: 4 }}>
            {(["monthly", "yearly"] as const).map(v => (
              <button key={v} onClick={() => setBillingInterval(v)}
                style={{ padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none", background: billingInterval === v ? "var(--card)" : "transparent", color: billingInterval === v ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "'Satoshi', sans-serif", fontSize: 13, cursor: "pointer", boxShadow: billingInterval === v ? "var(--shadow-xs)" : "none", fontWeight: billingInterval === v ? 500 : 400 }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
                {v === "yearly" && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--brand)", background: "var(--brand-faint)", borderRadius: 100, padding: "2px 7px" }}>Save 20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 56 }}>
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = session?.user?.plan === plan.id;
            const price = billingInterval === "yearly" && plan.id !== "free" ? annualPrice(plan.price) : plan.price;
            const period = billingInterval === "yearly" && plan.id !== "free" ? "/year" : plan.period;

            return (
              <div key={plan.id} style={plan.featured ? featuredCard : card}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = plan.featured ? "0 0 0 1px rgba(99,102,241,0.1), var(--shadow-card)" : "var(--shadow-card)"}
              >
                {plan.featured && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", background: "var(--brand)", color: "#fff", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, fontFamily: "'Satoshi', sans-serif", fontWeight: 500 }}>
                    Most Popular
                  </div>
                )}

                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", marginBottom: 18 }}>
                  <Icon size={16} />
                </div>
                <div style={{ fontSize: 10, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "'Satoshi', sans-serif" }}>{plan.name}</div>
                <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
                  {price}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 3, fontFamily: "'Satoshi', sans-serif" }}>{period}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 22px", fontFamily: "'Satoshi', sans-serif" }}>{plan.description}</div>
                <div style={{ height: 1, background: "var(--border)", marginBottom: 18 }} />

                <div style={{ flex: 1 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 9, marginBottom: 9, alignItems: "flex-start", fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif" }}>
                      <Check size={12} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />{f}
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} style={{ display: "flex", gap: 9, marginBottom: 9, alignItems: "flex-start", fontSize: 12, color: "var(--text-disabled)", fontFamily: "'Satoshi', sans-serif" }}>
                      <X size={12} style={{ flexShrink: 0, marginTop: 2 }} />{f}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24 }}>
                  {plan.id === "free" ? (
                    isCurrent
                      ? <button style={btnGhost} disabled>Current Plan</button>
                      : <Link href={plan.ctaHref!} style={{ ...btnPrimary, textDecoration: "none" }}>{plan.cta}</Link>
                  ) : isCurrent
                    ? <button style={btnGhost} disabled>Current Plan</button>
                    : (
                      <button style={plan.featured ? btnPrimary : btnGhost} onClick={() => handleUpgrade(plan.id)} disabled={paying !== null}>
                        {paying === plan.id ? <><Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} /> Processing…</> : plan.cta}
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Audit */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 40, marginBottom: 72, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", boxShadow: "var(--shadow-card)" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 100, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#d97706", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Satoshi', sans-serif", marginBottom: 14 }}>
              <Sparkles size={10} /> Add-on
            </div>
            <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 10 }}>Deep Audit</h3>
            <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 38, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
              ₹1,650 <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>per audit</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 24px", fontFamily: "'Satoshi', sans-serif" }}>~$20 USD · Available on any plan</p>
            <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "var(--brand)", color: "#fff", borderRadius: "var(--radius)", fontSize: 13, fontFamily: "'Satoshi', sans-serif", fontWeight: 600, textDecoration: "none" }}>
              Request Deep Audit <ArrowRight size={13} />
            </Link>
          </div>
          <div>
            {DEEP_AUDIT_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Satoshi', sans-serif" }}>
                <Check size={12} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />{f}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: "var(--brand-faint)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--brand)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Satoshi', sans-serif", marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>Frequently asked questions</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 56 }}>
          {FAQS.map(faq => (
            <div key={faq.q} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 24 }}>
              <h4 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 8 }}>{faq.q}</h4>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8, fontFamily: "'Satoshi', sans-serif" }}>{faq.a}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Satoshi', sans-serif" }}>
          Questions? Email us at{" "}
          <a href="mailto:hello@auditsmart.io" style={{ color: "var(--brand)" }}>hello@auditsmart.io</a>
          {" "}— we respond within 24 hours.
        </div>
      </div>
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}