// app/dashboard/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, Zap, Brain, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const PLANS = [
  {
    id: "pro",
    name: "Pro Plan",
    price: 2999, // ₹2,999 in rupees
    priceDisplay: "₹2,999",
    description: "Perfect for active developers",
    icon: Zap,
    features: [
      "20 audits per month",
      "Claude Haiku AI",
      "Fix suggestions with code",
      "Deployment verdict",
      "Email support",
      "Priority queue",
    ],
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 4999, // ₹4,999 in rupees
    priceDisplay: "₹4,999",
    description: "For teams shipping to mainnet",
    icon: Brain,
    features: [
      "50 audits per month",
      "Claude Sonnet AI",
      "Full exploit scenarios",
      "API access",
      "24/7 priority support",
      "Custom audit rules",
    ],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400",
    popular: true,
  },
];

const DEEP_AUDIT = {
  id: "deep_audit",
  name: "Deep Audit",
  price: 1650, // ₹1,650
  priceDisplay: "₹1,650",
  description: "One-time premium audit",
  icon: Sparkles,
  features: [
    "Claude Opus AI (most powerful)",
    "Extended thinking - see AI reasoning",
    "Full exploit scenarios",
    "Production-ready fix code",
    "Deployment verdict",
    "Priority processing (2x faster)",
    "PDF report",
  ],
  color: "from-amber-500 to-amber-600",
  bgColor: "bg-amber-500/10",
  textColor: "text-amber-400",
};

export default function PaymentPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  
  const [selectedPlan, setSelectedPlan] = useState<string>(planParam || "pro");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!session && !isProcessing) {
      router.push("/login?callbackUrl=/dashboard/payment");
    }
  }, [session, router, isProcessing]);

  const handlePayment = async () => {
    if (!session) {
      router.push("/login?callbackUrl=/dashboard/payment");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");

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

      // Get amount based on selected plan
      const amount = selectedPlan === "deep_audit" 
        ? DEEP_AUDIT.price 
        : PLANS.find(p => p.id === selectedPlan)?.price || 2999;

      // Create order
      const orderResponse = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: amount * 100, // Convert to paise
        }),
      });

      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(order.error || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AuditSmart",
        description: `${selectedPlan === "deep_audit" ? "Deep Audit" : selectedPlan.toUpperCase() + " Plan"}`,
        order_id: order.order_id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Verify payment and update subscription
          const verifyResponse = await fetch("/api/payment/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan,
            }),
          });

          const verification = await verifyResponse.json();

          if (verification.success) {
            setSuccess(`Payment successful! Your ${selectedPlan === "deep_audit" ? "Deep Audit" : selectedPlan.toUpperCase()} plan is now active.`);
            
            // Update session to reflect new plan
            await update();
            
            // Redirect after 2 seconds
            setTimeout(() => {
              if (selectedPlan === "deep_audit") {
                router.push("/dashboard/audit");
              } else {
                router.push("/dashboard");
              }
            }, 2000);
          } else {
            throw new Error(verification.error || "Payment verification failed");
          }
        },
        theme: {
          color: "#612D53",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanDetails = () => {
    if (selectedPlan === "deep_audit") return DEEP_AUDIT;
    return PLANS.find(p => p.id === selectedPlan) || PLANS[0];
  };

  const planDetails = getPlanDetails();
  const Icon = planDetails.icon;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--frost)]">Complete Your Purchase</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Upgrade your plan to unlock more features and audits
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-green-500 font-medium">{success}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--frost)] mb-4">Select Plan</h2>
            
            {/* Pro Plan */}
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-[var(--plum-light)] bg-[var(--plum)]/10"
                      : "border-[var(--border)] hover:border-[var(--plum-light)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                        <PlanIcon className={`w-5 h-5 ${plan.textColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--frost)]">{plan.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[var(--frost)]">{plan.priceDisplay}</div>
                      <div className="text-xs text-[var(--text-muted)]">/month</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="text-xs text-[var(--text-secondary)]">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Deep Audit */}
            <button
              onClick={() => setSelectedPlan("deep_audit")}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedPlan === "deep_audit"
                  ? "border-[var(--plum-light)] bg-[var(--plum)]/10"
                  : "border-[var(--border)] hover:border-[var(--plum-light)]/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--frost)]">Deep Audit</h3>
                    <p className="text-sm text-[var(--text-secondary)]">One-time premium audit</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[var(--frost)]">₹1,650</div>
                  <div className="text-xs text-[var(--text-muted)]">one-time</div>
                </div>
              </div>
              {selectedPlan === "deep_audit" && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--text-secondary)]">
                    {DEEP_AUDIT.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Payment Summary */}
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--frost)] mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${planDetails.bgColor}`}>
                    <Icon className={`w-5 h-5 ${planDetails.textColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--frost)]">{planDetails.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{planDetails.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--frost)]">{planDetails.priceDisplay}</p>
                  {selectedPlan !== "deep_audit" && (
                    <p className="text-xs text-[var(--text-muted)]">billed monthly</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">Subtotal</span>
                  <span className="text-[var(--frost)]">{planDetails.priceDisplay}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">Tax (GST)</span>
                  <span className="text-[var(--text-secondary)]">Included</span>
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--border)]">
                  <span className="font-semibold text-[var(--frost)]">Total</span>
                  <span className="text-xl font-bold text-[var(--plum-light)]">{planDetails.priceDisplay}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Pay {planDetails.priceDisplay}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-[var(--text-muted)]">
                Secure payment powered by Razorpay. Your card details are encrypted.
              </p>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-[var(--frost)] text-center mb-6">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-[var(--text-secondary)]">Feature</th>
                  <th className="text-center py-3 px-4 text-[var(--frost)]">Free</th>
                  <th className="text-center py-3 px-4 text-[var(--frost)]">Pro</th>
                  <th className="text-center py-3 px-4 text-[var(--frost)]">Enterprise</th>
                  <th className="text-center py-3 px-4 text-[var(--frost)]">Deep Audit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 text-[var(--text-secondary)]">Audits/month</td>
                  <td className="text-center py-3 px-4 text-[var(--text-primary)]">3</td>
                  <td className="text-center py-3 px-4 text-[var(--text-primary)]">20</td>
                  <td className="text-center py-3 px-4 text-[var(--text-primary)]">50</td>
                  <td className="text-center py-3 px-4 text-[var(--text-primary)]">1 (one-time)</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 text-[var(--text-secondary)]">AI Model</td>
                  <td className="text-center py-3 px-4">Gemini</td>
                  <td className="text-center py-3 px-4">Claude Haiku</td>
                  <td className="text-center py-3 px-4">Claude Sonnet</td>
                  <td className="text-center py-3 px-4">Claude Opus</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 text-[var(--text-secondary)]">Extended Thinking</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 text-[var(--text-secondary)]">Fix Suggestions</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 text-[var(--text-secondary)]">Exploit Scenarios</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">Priority Support</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Mode Notice */}
        {process.env.NEXT_PUBLIC_RAZORPAY_TEST_MODE === "true" && (
          <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500 text-center">
              🧪 TEST MODE: Use test card 4111 1111 1111 1111 (CVV: any, Expiry: any future date)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}