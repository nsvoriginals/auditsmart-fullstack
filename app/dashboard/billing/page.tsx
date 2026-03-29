"use client";
// src/app/dashboard/billing/page.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Spinner, PlanBadge } from "@/components/ui";

interface BillingStatus {
  plan: string;
  is_premium: boolean;
  status: string;
  expires_at: string | null;
  days_remaining: number | null;
  audits_remaining: number;
  payment_history: { id: string; plan: string; amount_inr: number; status: string; date: string }[];
}

export default function BillingPage() {
  const { data: session, update } = useSession();
  const [billing, setBilling]     = useState<BillingStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch("/api/payment/subscription").then(r => r.json()).then(d => {
      setBilling(d);
      setLoading(false);
    });
  }, []);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You will be downgraded to the free plan.")) return;
    setCancelling(true);
    await fetch("/api/payment/subscription/cancel", { method: "DELETE" });
    await update();    // refresh NextAuth session
    const d = await fetch("/api/payment/subscription").then(r => r.json());
    setBilling(d);
    setCancelling(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl mb-1" style={{ color: "var(--frost)" }}>Billing & Plan</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage your subscription and view payment history.</p>
      </div>

      {loading ? (
        <div className="card p-8 flex justify-center"><Spinner size={24} /></div>
      ) : billing ? (
        <>
          {/* Current plan card */}
          <div className="card p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-sub mb-1">Current Plan</p>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl" style={{ color: "var(--frost)" }}>
                    {billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)}
                  </h2>
                  <PlanBadge plan={billing.plan} />
                </div>
              </div>
              {billing.is_premium && billing.expires_at && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Renews in</p>
                  <p className="font-mono text-lg font-medium" style={{ color: "var(--frost)" }}>
                    {billing.days_remaining ?? 0} days
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ background: "var(--bg-surface)" }}>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Audits remaining</p>
                <p className="font-mono text-xl font-medium mt-0.5" style={{ color: "var(--frost)" }}>
                  {billing.audits_remaining}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Status</p>
                <p className="text-sm font-medium mt-0.5" style={{
                  color: billing.status === "active" ? "#4ade80" : billing.status === "none" ? "var(--text-muted)" : "#facc15"
                }}>
                  {billing.status === "none" ? "Free tier" : billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!billing.is_premium && (
                <Link href="/pricing" className="btn btn-primary btn-md">Upgrade Plan</Link>
              )}
              {billing.is_premium && (
                <button onClick={handleCancel} disabled={cancelling} className="btn btn-danger btn-md">
                  {cancelling ? <><Spinner size={14} /> Cancelling…</> : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>

          {/* Payment history */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="section-title mb-0">Payment History</h3>
            </div>
            {billing.payment_history.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No payments yet.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {billing.payment_history.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>
                        {p.plan} plan
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium" style={{ color: "var(--frost)" }}>
                        ₹{p.amount_inr.toLocaleString("en-IN")}
                      </p>
                      <span className="text-xs" style={{ color: p.status === "verified" ? "#4ade80" : "#facc15" }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}