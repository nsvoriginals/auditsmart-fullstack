"use client";
// src/app/pricing/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Check, X, Sparkles, Zap, Shield, Crown, ArrowRight, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

// Extend the Session type locally
interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    plan?: string;  // Add plan property
    image?: string | null;
  }
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Try before you commit",
    icon: Shield,
    features: [
      "3 audits included",
      "Groq LLaMA + Gemini analysis",
      "PDF audit report",
      "Community support",
    ],
    missing: ["Fix suggestions", "Exploit scenarios", "Claude AI models"],
    cta: "Start free",
    ctaHref: "/register",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹2,900",
    period: "/month",
    description: "For active developers",
    icon: Zap,
    features: [
      "20 audits / month",
      "Groq + Claude Haiku",
      "PDF audit reports",
      "Fix suggestions with code",
      "Deployment verdict",
      "Email support",
    ],
    missing: ["Exploit scenarios", "Claude Sonnet / Opus"],
    cta: "Upgrade to Pro",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹4,900",
    period: "/month",
    description: "For teams shipping to mainnet",
    icon: Crown,
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
    cta: "Upgrade to Enterprise",
    featured: false,
  },
];

const DEEP_AUDIT = {
  price: "₹1,650",
  tagline: "~$20 USD · Available on any plan",
  features: [
    "Claude Opus — most powerful AI",
    "Extended thinking — see full AI reasoning",
    "Full exploit PoC for every critical finding",
    "Production-ready patched code",
    "Deployment verdict: SAFE / CAUTION / DO NOT DEPLOY",
    "Priority processing",
  ],
};

const FAQS = [
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, UPI, and net banking via Razorpay.",
  },
  {
    question: "Is there a long-term contract?",
    answer: "No, all plans are month-to-month. You can cancel anytime with no hidden fees.",
  },
  {
    question: "Do you offer team discounts?",
    answer: "Yes, for Enterprise plans we offer volume discounts. Contact sales for a custom quote.",
  },
];

export default function PricingPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const router = useRouter();
  const [paying, setPaying] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const handleUpgrade = async (planId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    // FIX: Use optional chaining for session.user.plan
    if (session.user?.plan === planId) {
      toast.info("You're already on this plan");
      return;
    }

    setPaying(planId);

    try {
      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const orderRes = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval: billingInterval }),
      });

      const order = await orderRes.json();

      if (!orderRes.ok) {
        toast.error(order.detail ?? "Order creation failed");
        setPaying(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AuditSmart",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — ${billingInterval === "yearly" ? "Yearly" : "Monthly"}`,
        order_id: order.order_id,
        theme: { color: "#272757" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verRes = await fetch("/api/payment/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan: planId }),
          });

          const ver = await verRes.json();

          if (ver.status === "success") {
            toast.success(`Upgraded to ${planId}! Refreshing session...`);
            setTimeout(() => router.push("/dashboard"), 1500);
          } else {
            toast.error("Payment verification failed. Contact support.");
          }
        },
      });

      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPaying(null);
    }
  };

  const getAnnualPrice = (monthlyPrice: string) => {
    const match = monthlyPrice.match(/₹([\d,]+)/);
    if (!match) return monthlyPrice;
    const price = parseInt(match[1].replace(/,/g, ""));
    const annualPrice = Math.floor(price * 10); // 2 months free
    return `₹${annualPrice.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with 3 audits. Upgrade when your contracts need more protection.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs
            defaultValue="monthly"
            value={billingInterval}
            onValueChange={(v) => setBillingInterval(v as "monthly" | "yearly")}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Save 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            // FIX: Use optional chaining for session.user?.plan
            const isCurrent = session?.user?.plan === plan.id;
            const isDisabled = paying !== null;
            const displayPrice = billingInterval === "yearly" && plan.id !== "free"
              ? getAnnualPrice(plan.price)
              : plan.price;
            const displayPeriod = billingInterval === "yearly" && plan.id !== "free"
              ? "/year"
              : plan.period;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 ${
                  plan.featured
                    ? "border-primary shadow-lg scale-105 md:scale-105"
                    : "hover:shadow-md hover:-translate-y-1"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-sm">
                      {plan.name}
                    </Badge>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    {displayPrice}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {displayPeriod}
                    </span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.missing.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 opacity-50">
                        <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {plan.id === "free" ? (
                    isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={plan.ctaHref!}>{plan.cta}</Link>
                      </Button>
                    )
                  ) : isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isDisabled}
                      className={`w-full ${plan.featured ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      {paying === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Deep Audit Add-on */}
        <Card className="mb-20 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <Badge variant="secondary" className="font-mono">
                    Add-on
                  </Badge>
                  <span className="font-semibold text-lg">Deep Audit</span>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{DEEP_AUDIT.price}</span>
                  <span className="text-muted-foreground ml-2">per audit</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{DEEP_AUDIT.tagline}</p>
                <Button asChild>
                  <Link href="/dashboard/scan">
                    Request Deep Audit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div>
                <ul className="space-y-3">
                  {DEEP_AUDIT.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about our pricing and plans
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {FAQS.map((faq, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {faq.answer}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <Separator className="mb-8" />
          <p className="text-muted-foreground">
            Questions? Email us at{" "}
            <a
              href="mailto:hello@auditsmart.io"
              className="text-primary hover:underline font-medium"
            >
              hello@auditsmart.io
            </a>
            {" "}— we respond within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}