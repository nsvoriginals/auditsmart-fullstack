"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface BillingStatus {
  plan: string; is_premium: boolean; status: string; expires_at: string | null;
  days_remaining: number | null; audits_remaining: number;
  payment_history: { id: string; plan: string; amount_inr: number; status: string; date: string }[];
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
  .billing-root { font-family: 'DM Mono', monospace; color: #f0f0f5; max-width: 680px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f0f0f5; letter-spacing: -0.5px; margin-bottom: 6px; }
  .page-sub { font-size: 12px; color: #6b6b85; margin-bottom: 32px; }
  .card { background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 14px; margin-bottom: 16px; overflow: hidden; }
  .card-body { padding: 28px; }
  .section-label { font-size: 10px; color: #6b6b85; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  .plan-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
  .plan-name { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #f0f0f5; letter-spacing: -0.5px; margin-top: 2px; }
  .plan-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-left: 10px; font-weight: 500; }
  .plan-badge.premium { background: rgba(99,102,241,0.12); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2); }
  .plan-badge.free { background: rgba(100,116,139,0.1); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }
  .renews-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #f0f0f5; }
  .renews-sub { font-size: 10px; color: #6b6b85; text-transform: uppercase; letter-spacing: 0.06em; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 20px; background: #111118; border-top: 1px solid #1e1e2e; border-bottom: 1px solid #1e1e2e; }
  .stat-block { }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #f0f0f5; }
  .stat-lbl { font-size: 10px; color: #6b6b85; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
  .actions-row { padding: 20px 28px; display: flex; gap: 10px; }
  .btn-upgrade { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; text-decoration: none; transition: background 0.15s; }
  .btn-upgrade:hover { background: #5254cc; }
  .btn-cancel { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: transparent; color: #6b6b85; border: 1px solid #1e1e2e; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.15s; }
  .btn-cancel:hover { border-color: rgba(239,68,68,0.3); color: #fca5a5; }
  .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
  .card-header { padding: 18px 24px; border-bottom: 1px solid #1e1e2e; }
  .card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #e0e0f0; }
  .history-empty { padding: 40px 24px; text-align: center; font-size: 12px; color: #6b6b85; }
  .history-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #1e1e2e; }
  .history-row:last-child { border-bottom: none; }
  .history-plan { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #f0f0f5; text-transform: capitalize; }
  .history-date { font-size: 11px; color: #6b6b85; margin-top: 3px; }
  .history-amount { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #f0f0f5; text-align: right; }
  .history-status { font-size: 10px; margin-top: 2px; text-align: right; }
  .status-verified { color: #6ee7b7; }
  .status-pending { color: #fde047; }
  .skeleton { background: #111118; border-radius: 8px; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .spin { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function BillingPage() {
  const { update } = useSession();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch("/api/payment/subscription").then(r => r.json()).then(d => { setBilling(d); setLoading(false); });
  }, []);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll be downgraded to the free plan.")) return;
    setCancelling(true);
    await fetch("/api/payment/subscription/cancel", { method: "DELETE" });
    await update();
    const d = await fetch("/api/payment/subscription").then(r => r.json());
    setBilling(d); setCancelling(false);
  };

  return (
    <div className="billing-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="page-title">Billing & Plan</div>
      <div className="page-sub">Manage your subscription and view payment history.</div>

      {loading ? (
        <div className="card">
          <div className="card-body">
            <div className="skeleton" style={{ height: 80, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        </div>
      ) : billing ? (
        <>
          {/* Plan card */}
          <div className="card">
            <div className="card-body">
              <div className="section-label">Current Plan</div>
              <div className="plan-row">
                <div>
                  <span className="plan-name">{billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)}</span>
                  <span className={`plan-badge ${billing.is_premium ? "premium" : "free"}`}>
                    {billing.is_premium ? "Premium" : "Free"}
                  </span>
                </div>
                {billing.is_premium && billing.expires_at && (
                  <div style={{ textAlign: "right" }}>
                    <div className="renews-val">{billing.days_remaining ?? 0}d</div>
                    <div className="renews-sub">until renewal</div>
                  </div>
                )}
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-block">
                <div className="stat-num">{billing.audits_remaining}</div>
                <div className="stat-lbl">Audits remaining</div>
              </div>
              <div className="stat-block">
                <div className="stat-num" style={{ color: billing.status === "active" ? "#6ee7b7" : billing.status === "none" ? "#6b6b85" : "#fde047", fontSize: 14 }}>
                  {billing.status === "none" ? "Free tier" : billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                </div>
                <div className="stat-lbl">Status</div>
              </div>
            </div>

            <div className="actions-row">
              {!billing.is_premium && (
                <Link href="/pricing" className="btn-upgrade">Upgrade Plan</Link>
              )}
              {billing.is_premium && (
                <button onClick={handleCancel} disabled={cancelling} className="btn-cancel">
                  {cancelling ? <><div className="spin" /> Cancelling…</> : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>

          {/* Payment history */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Payment History</div>
            </div>

            {billing.payment_history.length === 0 ? (
              <div className="history-empty">No payments yet.</div>
            ) : (
              billing.payment_history.map(p => (
                <div key={p.id} className="history-row">
                  <div>
                    <div className="history-plan">{p.plan} plan</div>
                    <div className="history-date">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                  <div>
                    <div className="history-amount">₹{p.amount_inr.toLocaleString("en-IN")}</div>
                    <div className={`history-status ${p.status === "verified" ? "status-verified" : "status-pending"}`}>{p.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}