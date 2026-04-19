"use client";

import React, { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PLAN_DETAILS, PLAN_FEATURES } from "@/lib/plans";
import {
  Zap, Shield, Brain, Sparkles, CheckCircle, CreditCard,
  Loader2, AlertCircle, Clock, Calendar, RotateCcw,
  TrendingUp, Star, X,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export interface BillingStatus {
  plan: string;
  is_premium: boolean;
  status: string;
  expires_at: string | null;
  days_remaining: number | null;
  audits_remaining: number;
  cancel_at_period_end?: boolean;
  payment_history: { id: string; plan: string; amount_inr: number; status: string; date: string }[];
}

type PaidPlan = "pro" | "enterprise" | "deep_audit";

const PLAN_META: Record<PaidPlan, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  pro:        { icon: Zap,      color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)",  label: "Pro"        },
  enterprise: { icon: Brain,    color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", label: "Enterprise" },
  deep_audit: { icon: Sparkles, color: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)", label: "Deep Audit" },
};

const PLAN_BADGE: Record<string, { text: string; style: React.CSSProperties }> = {
  free:       { text: "Free",       style: { background: "var(--elevated)", color: "var(--text-muted)",    border: "1px solid var(--border)" } },
  premium:    { text: "Pro",        style: { background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" } },
  enterprise: { text: "Enterprise", style: { background: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" } },
  admin:      { text: "Admin",      style: { background: "rgba(16,185,129,0.12)", color: "#6ee7b7",  border: "1px solid rgba(16,185,129,0.2)" } },
};

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(s);
  });
}

export default function BillingClient({ initialData }: { initialData: BillingStatus }) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [billing, setBilling] = useState<BillingStatus>(initialData);
  const [payPlan, setPayPlan]   = useState<PaidPlan | null>(null);
  const [paying, setPaying]     = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast]       = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBilling = useCallback(async () => {
    const r = await fetch("/api/payment/subscription");
    if (r.ok) setBilling(await r.json());
  }, []);

  const initiatePayment = async (plan: PaidPlan) => {
    if (paying) return;
    setPayPlan(plan);
    setPaying(true);
    try {
      await loadRazorpay();

      const orderRes = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Failed to create order");

      await new Promise<void>((resolve, reject) => {
        const rz = new window.Razorpay({
          key:         order.key_id,
          amount:      order.amount,
          currency:    order.currency,
          order_id:    order.order_id,
          name:        "AuditSmart",
          description: PLAN_META[plan].label + " Plan",
          prefill: {
            name:  session?.user?.name  || "",
            email: session?.user?.email || "",
          },
          theme: { color: PLAN_META[plan].color },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          handler: async (resp: Record<string, string>) => {
            try {
              const vr = await fetch("/api/payment/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id:   resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature:  resp.razorpay_signature,
                  plan,
                }),
              });
              const vd = await vr.json();
              if (!vr.ok) throw new Error(vd.error || "Verification failed");
              await update({ user: { refresh: true } });
              await fetchBilling();
              router.refresh();
              window.dispatchEvent(new CustomEvent("plan-upgraded", { detail: { role: vd.user?.role } }));
              showToast("success", `Successfully upgraded to ${PLAN_META[plan].label}!`);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        });
        rz.open();
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      if (msg !== "Payment cancelled") showToast("error", msg);
    } finally {
      setPaying(false);
      setPayPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    setCancelling(true);
    try {
      const r = await fetch("/api/payment/subscription/cancel", { method: "DELETE" });
      if (!r.ok) throw new Error("Cancellation failed");
      await update({ user: { refresh: true } });
      await fetchBilling();
      router.refresh();
      showToast("success", "Subscription cancelled. Access remains until period end.");
    } catch {
      showToast("error", "Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const currentPlan = billing.plan || "free";
  const badge = PLAN_BADGE[currentPlan] || PLAN_BADGE.free;
  const isPaid = billing.is_premium;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", fontFamily: "'Satoshi', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px", borderRadius: 12,
          background: toast.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.type === "success" ? "#6ee7b7" : "#fca5a5",
          fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)",
          maxWidth: 340,
        }}>
          {toast.type === "success"
            ? <CheckCircle size={16} style={{ flexShrink: 0 }} />
            : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", marginLeft: 4, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 6 }}>
          Billing &amp; Subscription
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Manage your plan, upgrade, and view payment history — all without leaving the dashboard.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Current plan status ── */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-disabled)", marginBottom: 10 }}>
              Current Plan
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--text-primary)" }}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, letterSpacing: "0.06em", textTransform: "uppercase", ...badge.style }}>
                  {badge.text}
                </span>
                {billing.cancel_at_period_end && (
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
                    Cancels at period end
                  </span>
                )}
              </div>
              {isPaid && billing.expires_at && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <Calendar size={13} />
                  Renews <span suppressHydrationWarning>{new Date(billing.expires_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {billing.days_remaining !== null && (
                    <span style={{ marginLeft: 4, padding: "2px 8px", borderRadius: 5, background: "rgba(99,102,241,0.08)", color: "#a5b4fc", fontSize: 11 }}>
                      {billing.days_remaining}d left
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 0 }}>
            {[
              {
                icon: <Shield size={15} style={{ color: "#6366f1" }} />,
                val: billing.audits_remaining >= 9999 ? "∞" : billing.audits_remaining,
                lbl: "Audits Remaining",
              },
              {
                icon: <Clock size={15} style={{ color: "#10b981" }} />,
                val: billing.status === "none" ? "Free tier" : billing.status.charAt(0).toUpperCase() + billing.status.slice(1),
                lbl: "Status",
                color: billing.status === "active" ? "#10b981" : billing.status === "cancelled" ? "#f59e0b" : undefined,
              },
              {
                icon: <TrendingUp size={15} style={{ color: "#8b5cf6" }} />,
                val: isPaid ? (billing.days_remaining ?? 0) + " days" : "Lifetime",
                lbl: isPaid ? "Until Renewal" : "Plan Type",
              },
            ].map(({ icon, val, lbl, color }, i) => (
              <div key={lbl} style={{
                padding: "16px 20px",
                borderLeft: i > 0 ? "1px solid var(--border)" : undefined,
                background: "var(--elevated)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, color: color || "var(--text-primary)", marginBottom: 2 }}>{val}</div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-disabled)" }}>{lbl}</div>
              </div>
            ))}
          </div>

          {isPaid && !billing.cancel_at_period_end && (
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-muted)", cursor: cancelling ? "not-allowed" : "pointer",
                  opacity: cancelling ? 0.6 : 1, transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                {cancelling ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RotateCcw size={13} />}
                {cancelling ? "Cancelling…" : "Cancel Subscription"}
              </button>
            </div>
          )}
        </div>

        {/* ── Upgrade Plans ── */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
              {isPaid ? "Change Plan" : "Upgrade Your Plan"}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Secure payment via Razorpay — UPI, cards, netbanking all supported.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {(["pro", "enterprise", "deep_audit"] as PaidPlan[]).map((plan) => {
              const meta   = PLAN_META[plan];
              const detail = PLAN_DETAILS[plan];
              const feats  = PLAN_FEATURES[plan];
              const Icon   = meta.icon;
              const isCurrentPlan = currentPlan === plan || (currentPlan === "premium" && plan === "pro") || (currentPlan === "enterprise" && plan === "enterprise");
              const isBusy = paying && payPlan === plan;

              return (
                <div key={plan} style={{
                  background: "var(--card)",
                  border: `1px solid ${isCurrentPlan ? meta.color : "var(--border)"}`,
                  borderRadius: 14,
                  padding: "20px 20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  position: "relative",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: isCurrentPlan ? `0 0 0 1px ${meta.color}33` : "none",
                }}>
                  {plan === "enterprise" && (
                    <div style={{
                      position: "absolute", top: -10, left: 16,
                      background: meta.color, color: "#fff", fontSize: 9,
                      fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                    }}>Most Popular</div>
                  )}

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.bg, border: `1px solid ${meta.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{meta.label}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                          {plan === "deep_audit" ? "One-time" : "Per month"}
                        </div>
                      </div>
                    </div>
                    {isCurrentPlan && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontWeight: 600 }}>
                        Active
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: "clamp(26px, 5vw, 30px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                      ${detail.displayPrice.toLocaleString("en-US")}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
                      {plan === "deep_audit" ? "one-time" : "/ month"}
                    </span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    {feats.slice(0, 5).map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: "var(--text-secondary)" }}>
                        <CheckCircle size={12} style={{ color: meta.color, flexShrink: 0, marginTop: 1 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => initiatePayment(plan)}
                    disabled={paying || isCurrentPlan}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 9,
                      background: isCurrentPlan
                        ? "var(--elevated)"
                        : paying && payPlan === plan
                        ? meta.bg
                        : `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                      color: isCurrentPlan ? "var(--text-disabled)" : "#fff",
                      border: isCurrentPlan ? "1px solid var(--border)" : "none",
                      fontSize: 13, fontWeight: 600, cursor: isCurrentPlan ? "default" : paying ? "wait" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      transition: "opacity 0.15s",
                      opacity: paying && payPlan !== plan ? 0.6 : 1,
                    }}
                  >
                    {isBusy ? (
                      <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                    ) : isCurrentPlan ? (
                      <><Star size={13} /> Current Plan</>
                    ) : (
                      <><CreditCard size={13} /> {plan === "deep_audit" ? `Pay $${detail.displayPrice.toLocaleString("en-US")}` : `Subscribe $${detail.displayPrice.toLocaleString("en-US")}/mo`}</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 12, fontSize: 11, color: "var(--text-disabled)", textAlign: "center" }}>
            Secure payment via Razorpay &nbsp;·&nbsp; UPI, cards &amp; netbanking &nbsp;·&nbsp; All plans include PDF reports
          </p>
        </div>

        {/* ── Payment History ── */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={14} style={{ color: "var(--text-muted)" }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Payment History</h2>
          </div>
          {billing.payment_history.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-disabled)", fontSize: 12 }}>
              No payments yet. Upgrade your plan to get started.
            </div>
          ) : (
            billing.payment_history.map((p, i) => {
              const isLast = i === billing.payment_history.length - 1;
              const planLabel = p.plan === "premium" ? "Pro" : p.plan.charAt(0).toUpperCase() + p.plan.slice(1);
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 24px", flexWrap: "wrap", gap: 8,
                  borderBottom: isLast ? "none" : "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={14} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{planLabel} Plan</div>
                      <div suppressHydrationWarning style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {new Date(p.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      ₹{p.amount_inr.toLocaleString("en-IN")}
                    </div>
                    <div style={{
                      marginTop: 2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                      color: p.status === "paid" || p.status === "verified" ? "#10b981" : p.status === "failed" ? "#ef4444" : "#f59e0b",
                    }}>
                      {p.status}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
