"use client";
// components/sections/home/pricing.tsx — Pricing section

import Link from "next/link";
import { motion } from "framer-motion";
import { ease, dur } from "@/components/motion/config";
import { Reveal } from "@/components/motion/primitives";
import { Check, Zap } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For individual developers and learning.",
    color: "#00ff88",
    cta: "Start Free",
    href: "/register",
    features: [
      "3 audits / month",
      "Slither + AST analysis",
      "3 Groq AI agents",
      "PDF report",
      "Community support",
    ],
    missing: ["Slither full suite", "All 10 AI agents", "pgvector exploit search", "SARIF export", "GitHub integration"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹299",
    period: "/ month",
    desc: "For serious security researchers and protocol teams.",
    color: "#00d4ff",
    cta: "Start Pro",
    href: "/checkout",
    featured: true,
    features: [
      "Unlimited audits",
      "Full Slither + Semgrep + AST",
      "All 10 AI agents",
      "pgvector exploit similarity",
      "SARIF 2.1.0 export",
      "Ed25519 signed reports",
      "Email support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For audit firms, DAOs, and enterprise security teams.",
    color: "#a855f7",
    cta: "Contact Sales",
    href: "/contact",
    features: [
      "Everything in Pro",
      "GitHub App integration",
      "Custom SWC rules",
      "Multi-org management",
      "SLA + dedicated support",
      "On-premise deployment",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-32 overflow-hidden" style={{ background: "var(--surface-1)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--border)" }} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        <div className="text-center mb-20">
          <Reveal>
            <span
              className="text-xs font-semibold tracking-widest uppercase mb-4 block"
              style={{ color: "var(--brand)", fontFamily: "var(--font-dm-mono)" }}
            >
              Pricing
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              className="text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
            >
              START FREE.<br />SCALE WHEN READY.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              className="relative rounded-2xl border p-8 flex flex-col"
              style={{
                background: plan.featured ? `linear-gradient(135deg, ${plan.color}10, ${plan.color}04)` : "var(--surface-2)",
                borderColor: plan.featured ? plan.color + "40" : "var(--border)",
                boxShadow: plan.featured ? `0 0 60px ${plan.color}12` : "none",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: dur.medium, ease: ease.expo, delay: i * 0.1 }}
            >
              {plan.featured && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ background: plan.color, color: "#000" }}
                >
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="mb-8">
                <div
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: plan.color, fontFamily: "var(--font-dm-mono)" }}
                >
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className="text-5xl font-black"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {plan.desc}
                </p>
              </div>

              {/* Features */}
              <div className="flex-1 mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <Link
                href={plan.href}
                className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-300"
                style={
                  plan.featured
                    ? { background: plan.color, color: "#000" }
                    : {
                        background: "transparent",
                        color: plan.color,
                        border: `1px solid ${plan.color}40`,
                      }
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
