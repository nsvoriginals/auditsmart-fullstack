"use client";
// src/app/pricing/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Spinner, Toast } from "@/components/ui";

declare global { interface Window { Razorpay: new (options: Record<string, unknown>) => { open: () => void }; } }

const PLANS = [
  {
    id:       "free",
    name:     "Free",
    price:    "₹0",
    period:   "forever",
    tagline:  "Try before you commit",
    features: [
      "3 audits included",
      "Groq LLaMA + Gemini analysis",
      "PDF audit report",
      "Community support",
    ],
    missing: ["Fix suggestions", "Exploit scenarios", "Claude AI models"],
    cta:     "Start free",
    ctaHref: "/register",
    featured: false,
  },
  {
    id:       "pro",
    name:     "Pro",
    price:    "₹2,900",
    period:   "/ month",
    tagline:  "For active developers",
    features: [
      "20 audits / month",
      "Groq + Claude Haiku",
      "PDF audit reports",
      "Fix suggestions with code",
      "Deployment verdict",
      "Email support",
    ],
    missing: ["Exploit scenarios", "Claude Sonnet / Opus"],
    cta:     "Upgrade to Pro",
    featured: true,
  },
  {
    id:       "enterprise",
    name:     "Enterprise",
    price:    "₹4,900",
    period:   "/ month",
    tagline:  "For teams shipping to mainnet",
    features: [
      "50 audits / month",
      "Groq + Claude Sonnet",
      "PDF audit reports",
      "Fix suggestions with code",
      "Full exploit scenarios",
      "Deployment verdict",
      "API access",
      "Priority support",
    ],
    missing: [],
    cta:     "Upgrade to Enterprise",
    featured: false,
  },
];

const DEEP_AUDIT = {
  price:    "₹1,650",
  tagline:  "~$20 USD · Available on any plan",
  features: [
    "Claude Opus — most powerful AI",
    "Extended thinking — see full AI reasoning",
    "Full exploit PoC for every critical finding",
    "Production-ready patched code",
    "Deployment verdict: SAFE / CAUTION / DO NOT DEPLOY",
    "Priority processing",
  ],
};

export default function PricingPage() {
  const { data: session } = useSession();
  const router  = useRouter();
  const [paying, setPaying] = useState<string | null>(null);
  const [toast, setToast]  = useState<{ msg: string; type: "success"|"error"|"info" }|null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    if (session.user.plan === planId) { setToast({ msg: "You're already on this plan.", type: "info" }); return; }

    setPaying(planId);
    // Load Razorpay script
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      await new Promise(res => { script.onload = res; });
    }

    const orderRes = await fetch("/api/payment/razorpay/create-order", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ plan: planId }),
    });
    const order = await orderRes.json();
    setPaying(null);
    if (!orderRes.ok) { setToast({ msg: order.detail ?? "Order creation failed.", type: "error" }); return; }

    const rzp = new window.Razorpay({
      key:         order.key_id,
      amount:      order.amount,
      currency:    order.currency,
      name:        "AuditSmart",
      description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — Monthly`,
      order_id:    order.order_id,
      theme:       { color: "#612D53" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verRes = await fetch("/api/payment/razorpay/verify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ ...response, plan: planId }),
        });
        const ver = await verRes.json();
        if (ver.status === "success") {
          setToast({ msg: `✦ Upgraded to ${planId}! Refreshing session…`, type: "success" });
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setToast({ msg: "Payment verification failed. Contact support.", type: "error" });
        }
      },
    });
    rzp.open();
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <Navbar />

      <div id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-sub">Pricing</p>
          <h1 className="font-display text-5xl mb-4" style={{ color: "var(--frost)" }}>
            Pay for what you use.
          </h1>
          <p className="text-lg max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            Start free with 3 audits. Upgrade when your contracts need more.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const isCurrent  = session?.user?.plan === plan.id;
            const isDisabled = paying !== null;
            return (
              <div key={plan.id} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
                {plan.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="badge badge-premium text-xs">Most Popular</span>
                  </div>
                )}
                <div>
                  <p className="section-sub mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display text-4xl" style={{ color: "var(--frost)" }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>{plan.period}</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{plan.tagline}</p>
                </div>

                <div className="divider my-0" />

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--plum-light)" strokeWidth="2.5" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  isCurrent ? (
                    <div className="btn btn-ghost btn-md w-full" style={{ cursor: "default", opacity: 0.7 }}>Current plan</div>
                  ) : (
                    <Link href={plan.ctaHref!} className="btn btn-ghost btn-md w-full text-center">{plan.cta}</Link>
                  )
                ) : isCurrent ? (
                  <div className="btn btn-ghost btn-md w-full" style={{ cursor: "default", opacity: 0.7 }}>Current plan</div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isDisabled}
                    className={`btn w-full btn-md ${plan.featured ? "btn-primary" : "btn-outline"}`}
                  >
                    {paying === plan.id ? <><Spinner size={15} /> Processing…</> : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Deep Audit add-on */}
        <div className="card p-8 relative overflow-hidden"
          style={{ borderColor: "var(--border-rose)", background: "linear-gradient(135deg, rgba(133,57,83,0.08) 0%, var(--bg-card) 70%)" }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--rose), transparent)" }} />
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="badge" style={{ background: "rgba(133,57,83,0.15)", color: "var(--rose-light)", border: "1px solid rgba(133,57,83,0.3)", fontFamily: "var(--font-mono)" }}>Add-on</span>
                <span className="font-display text-xl" style={{ color: "var(--frost)" }}>Deep Audit</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-4xl" style={{ color: "var(--frost)" }}>{DEEP_AUDIT.price}</span>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>per audit</span>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{DEEP_AUDIT.tagline}</p>
              <Link href="/dashboard/scan" className="btn btn-rose btn-md">
                Request Deep Audit
              </Link>
            </div>
            <ul className="space-y-2.5">
              {DEEP_AUDIT.features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose-light)" strokeWidth="2.5" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Questions? Email us at{" "}
            <a href="mailto:hello@auditsmart.io" style={{ color: "var(--plum-light)" }}>hello@auditsmart.io</a>
            {" "}— we respond within 24h.
          </p>
        </div>
      </div>
    </div>
  );
}