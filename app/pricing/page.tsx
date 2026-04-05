"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
  .pricing-root { background: #0a0a0f; min-height: 100vh; font-family: 'DM Mono', monospace; color: #f0f0f5; }
  .pricing-inner { max-width: 1080px; margin: 0 auto; padding: 80px 24px; }
  .pricing-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.08); color: #a5b4fc; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; }
  .pricing-title { font-family: 'Syne', sans-serif; font-size: clamp(32px,5vw,52px); font-weight: 800; letter-spacing: -1.5px; color: #f0f0f5; margin-bottom: 14px; }
  .pricing-sub { font-size: 13px; color: #6b6b85; max-width: 440px; margin: 0 auto; line-height: 1.8; }
  .toggle-wrap { display: inline-flex; background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 10px; padding: 4px; gap: 2px; }
  .toggle-btn { padding: 8px 20px; border: none; background: transparent; color: #6b6b85; font-family: 'DM Mono', monospace; font-size: 12px; border-radius: 7px; cursor: pointer; transition: all 0.15s; }
  .toggle-btn.active { background: #1e1e2e; color: #f0f0f5; }
  .save-pill { font-size: 10px; color: #a5b4fc; background: rgba(99,102,241,0.1); border-radius: 100px; padding: 2px 8px; margin-left: 6px; }
  .plans-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin: 48px 0; }
  .plan-card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 14px; padding: 28px; display: flex; flex-direction: column; transition: border-color 0.2s; position: relative; }
  .plan-card:hover { border-color: #2e2e45; }
  .plan-card.featured { border-color: rgba(99,102,241,0.4); background: linear-gradient(145deg, #0e0e1f, #0e0e18); }
  .plan-popular { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: #6366f1; color: #fff; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 100px; font-weight: 500; }
  .plan-icon { width: 36px; height: 36px; border-radius: 9px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; color: #a5b4fc; margin-bottom: 20px; }
  .plan-name { font-size: 11px; color: #6b6b85; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .plan-price { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: #f0f0f5; letter-spacing: -1px; }
  .plan-period { font-size: 12px; color: #6b6b85; font-weight: 400; margin-left: 4px; }
  .plan-desc { font-size: 12px; color: #6b6b85; margin: 8px 0 24px; }
  .plan-divider { border: none; border-top: 1px solid #1e1e2e; margin: 0 0 20px; }
  .plan-feature { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 12px; color: #a0a0b8; line-height: 1.5; }
  .plan-missing { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 12px; color: #2e2e45; line-height: 1.5; }
  .btn-plan-primary { margin-top: auto; padding: 11px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: background 0.15s; text-align: center; text-decoration: none; display: block; }
  .btn-plan-primary:hover { background: #5254cc; }
  .btn-plan-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-plan-ghost { margin-top: auto; padding: 11px; background: transparent; color: #6b6b85; border: 1px solid #1e1e2e; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.15s; text-align: center; text-decoration: none; display: block; }
  .btn-plan-ghost:hover { border-color: #2e2e45; color: #a0a0b8; }
  .btn-plan-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
  .deep-card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 14px; padding: 40px; margin-bottom: 72px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  .deep-tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 100px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fbbf24; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .deep-price { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; color: #f0f0f5; letter-spacing: -1px; }
  .deep-tagline { font-size: 11px; color: #6b6b85; margin: 6px 0 28px; }
  .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 60px; }
  .faq-item { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 12px; padding: 24px; }
  .faq-q { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #e0e0f0; margin-bottom: 8px; }
  .faq-a { font-size: 12px; color: #6b6b85; line-height: 1.8; }
  .contact-line { text-align: center; font-size: 12px; color: #6b6b85; padding-top: 24px; border-top: 1px solid #1e1e2e; }
  .contact-line a { color: #6366f1; text-decoration: none; }
  .contact-line a:hover { text-decoration: underline; }
  @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr; } .deep-card { grid-template-columns: 1fr; } .faq-grid { grid-template-columns: 1fr; } }
`;

export default function PricingPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const router = useRouter();
  const [paying, setPaying] = useState<string | null>(null);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  const handleUpgrade = async (planId: string) => {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    if (session.user?.plan === planId) { toast.info("You're already on this plan"); return; }
    setPaying(planId);
    try {
      if (!window.Razorpay) {
        const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; document.body.appendChild(s);
        await new Promise(r => { s.onload = r; });
      }
      const orderRes = await fetch("/api/payment/razorpay/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planId, interval }) });
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

  const annualPrice = (p: string) => {
    const m = p.match(/₹([\d,]+)/); if (!m) return p;
    return `₹${(parseInt(m[1].replace(/,/g, "")) * 10).toLocaleString()}`;
  };

  return (
    <div className="pricing-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Navbar />

      <div className="pricing-inner">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="pricing-badge">Pricing</div>
          <h1 className="pricing-title">Simple, transparent pricing</h1>
          <p className="pricing-sub">Start free with 3 audits. Upgrade when your contracts need more protection.</p>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
          <div className="toggle-wrap">
            <button className={`toggle-btn ${interval === "monthly" ? "active" : ""}`} onClick={() => setInterval("monthly")}>Monthly</button>
            <button className={`toggle-btn ${interval === "yearly" ? "active" : ""}`} onClick={() => setInterval("yearly")}>
              Yearly <span className="save-pill">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="plans-grid">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = session?.user?.plan === plan.id;
            const displayPrice = interval === "yearly" && plan.id !== "free" ? annualPrice(plan.price) : plan.price;
            const displayPeriod = interval === "yearly" && plan.id !== "free" ? "/year" : plan.period;

            return (
              <div key={plan.id} className={`plan-card ${plan.featured ? "featured" : ""}`}>
                {plan.featured && <div className="plan-popular">Most Popular</div>}
                <div className="plan-icon"><Icon size={16} /></div>
                <div className="plan-name">{plan.name}</div>
                <div>
                  <span className="plan-price">{displayPrice}</span>
                  <span className="plan-period">{displayPeriod}</span>
                </div>
                <div className="plan-desc">{plan.description}</div>
                <hr className="plan-divider" />

                <div style={{ flex: 1 }}>
                  {plan.features.map(f => (
                    <div key={f} className="plan-feature">
                      <Check size={12} color="#6ee7b7" style={{ flexShrink: 0, marginTop: 2 }} />{f}
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="plan-missing">
                      <X size={12} style={{ flexShrink: 0, marginTop: 2 }} />{f}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 28 }}>
                  {plan.id === "free" ? (
                    isCurrent
                      ? <button className="btn-plan-ghost" disabled>Current Plan</button>
                      : <Link href={plan.ctaHref!} className="btn-plan-primary">{plan.cta}</Link>
                  ) : isCurrent
                    ? <button className="btn-plan-ghost" disabled>Current Plan</button>
                    : (
                      <button
                        className={plan.featured ? "btn-plan-primary" : "btn-plan-ghost"}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={paying !== null}
                        style={{ width: "100%" }}
                      >
                        {paying === plan.id ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={12} style={{ animation: "spin 0.7s linear infinite" }} /> Processing…</span> : plan.cta}
                      </button>
                    )
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Audit */}
        <div className="deep-card">
          <div>
            <div className="deep-tag"><Sparkles size={10} /> Add-on</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: "#f0f0f5", marginBottom: 12 }}>Deep Audit</div>
            <div className="deep-price">₹1,650 <span style={{ fontSize: 14, fontWeight: 400, color: "#6b6b85" }}>per audit</span></div>
            <div className="deep-tagline">~$20 USD · Available on any plan</div>
            <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "#6366f1", color: "#fff", borderRadius: 8, fontSize: 12, textDecoration: "none", fontFamily: "'DM Mono', monospace" }}>
              Request Deep Audit <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {DEEP_AUDIT_FEATURES.map(f => (
              <div key={f} className="plan-feature"><Check size={12} color="#a5b4fc" style={{ flexShrink: 0, marginTop: 2 }} />{f}</div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="pricing-badge" style={{ marginBottom: 16 }}>FAQ</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: "#f0f0f5" }}>Frequently asked questions</h2>
        </div>

        <div className="faq-grid">
          {FAQS.map(faq => (
            <div key={faq.q} className="faq-item">
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>

        <div className="contact-line">
          Questions? Email us at{" "}
          <a href="mailto:hello@auditsmart.io">hello@auditsmart.io</a>
          {" "}— we respond within 24 hours.
        </div>
      </div>
    </div>
  );
}