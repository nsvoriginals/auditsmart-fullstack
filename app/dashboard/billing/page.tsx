"use client";
// app/dashboard/billing/page.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface BillingStatus {
  plan: string;
  is_premium: boolean;
  status: string;
  expires_at: string | null;
  days_remaining: number | null;
  audits_remaining: number;
  payment_history: {
    id: string;
    plan: string;
    amount_inr: number;
    status: string;
    date: string;
  }[];
}

export default function BillingPage() {
  const { update } = useSession();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch("/api/payment/subscription")
      .then((r) => r.json())
      .then((d) => { setBilling(d); setLoading(false); });
  }, []);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll be downgraded to the free plan.")) return;
    setCancelling(true);
    await fetch("/api/payment/subscription/cancel", { method: "DELETE" });
    await update();
    const d = await fetch("/api/payment/subscription").then((r) => r.json());
    setBilling(d);
    setCancelling(false);
  };

  return (
    <div className="max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-1.5">
        Billing &amp; Plan
      </h1>
      <p className="text-xs sm:text-sm text-text-muted mb-8">
        Manage your subscription and view payment history.
      </p>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="h-20 rounded-lg bg-elevated animate-pulse" />
          <div className="h-10 rounded-lg bg-elevated animate-pulse" />
        </div>
      ) : billing ? (
        <div className="space-y-4">
          {/* Plan card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-disabled mb-2">
                Current Plan
              </p>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                    {billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest border ${
                      billing.is_premium
                        ? "bg-[rgba(99,102,241,0.12)] text-[#a5b4fc] border-[rgba(99,102,241,0.2)]"
                        : "bg-elevated text-text-muted border-border"
                    }`}
                  >
                    {billing.is_premium ? "Premium" : "Free"}
                  </span>
                </div>
                {billing.is_premium && billing.expires_at && (
                  <div className="text-right">
                    <div className="text-2xl font-extrabold tracking-tight text-text-primary">
                      {billing.days_remaining ?? 0}d
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-text-disabled">
                      until renewal
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 px-5 sm:px-7 py-4 sm:py-5 bg-elevated border-t border-b border-border">
              <div>
                <div className="text-2xl font-extrabold tracking-tight text-text-primary">
                  {billing.audits_remaining}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-disabled mt-0.5">
                  Audits remaining
                </div>
              </div>
              <div>
                <div
                  className={`text-sm font-bold ${
                    billing.status === "active"
                      ? "text-success"
                      : billing.status === "none"
                      ? "text-text-disabled"
                      : "text-warning"
                  }`}
                >
                  {billing.status === "none"
                    ? "Free tier"
                    : billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-disabled mt-0.5">
                  Status
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2.5 px-5 sm:px-7 py-4 sm:py-5">
              {!billing.is_premium && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold transition-opacity hover:opacity-90"
                >
                  Upgrade Plan
                </Link>
              )}
              {billing.is_premium && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-transparent border border-border text-text-muted text-xs font-medium transition-all hover:border-destructive/40 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? (
                    <>
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Cancelling…
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Payment history */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 sm:px-7 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Payment History
              </h2>
            </div>

            {billing.payment_history.length === 0 ? (
              <div className="py-10 text-center text-xs text-text-muted">
                No payments yet.
              </div>
            ) : (
              billing.payment_history.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-border last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-bold text-text-primary capitalize">
                      {p.plan} plan
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {new Date(p.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-sm font-bold text-text-primary">
                      ₹{p.amount_inr.toLocaleString("en-IN")}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        p.status === "verified" ? "text-success" : "text-warning"
                      }`}
                    >
                      {p.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
