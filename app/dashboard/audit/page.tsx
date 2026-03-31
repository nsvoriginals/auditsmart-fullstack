// app/dashboard/audit/page.tsx (add limit checking)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, AlertCircle, CheckCircle, Zap, Shield, Brain, Sparkles, AlertTriangle } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Basic audit for small contracts",
    icon: Shield,
    features: ["3 audits/month", "Basic security checks", "Gemini AI", "8 specialized agents"],
    color: "from-green-500/20 to-green-600/20",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    description: "Advanced audit with fix suggestions",
    icon: Zap,
    features: ["10 audits/month", "Fix suggestions", "Claude Haiku", "Priority queue"],
    color: "from-blue-500/20 to-blue-600/20",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$60",
    description: "Deep analysis with exploit scenarios",
    icon: Brain,
    features: ["Unlimited audits", "Exploit scenarios", "Claude Sonnet", "24/7 support"],
    color: "from-purple-500/20 to-purple-600/20",
  },
  {
    id: "deep_audit",
    name: "Deep Audit",
    price: "$20",
    description: "One-time premium audit",
    icon: Sparkles,
    features: ["Claude Opus", "Extended thinking", "Exploit scenarios", "PDF report"],
    color: "from-amber-500/20 to-amber-600/20",
  },
];

export default function AuditPage() {
  const router = useRouter();
  const [contractCode, setContractCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  
  // Limit state
  const [userLimits, setUserLimits] = useState<{
    plan: string;
    auditsThisMonth: number;
    limit: number | null;
    remaining: number | null;
    canAudit: boolean;
    isUnlimited: boolean;
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);

  // Fetch user limits on mount
  useEffect(() => {
    fetchUserLimits();
  }, []);

  const fetchUserLimits = async () => {
    try {
      const response = await fetch("/api/user/limits");
      const data = await response.json();
      if (response.ok) {
        setUserLimits(data);
        
        // If free plan and no audits left, show warning
        if (data.plan === "FREE" && data.remaining === 0) {
          setError("You've reached your free audit limit this month. Please upgrade to continue.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
    } finally {
      setLoadingLimits(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractCode.trim()) {
      setError("Please enter your contract code");
      return;
    }

    // Check if user can audit
    if (userLimits && !userLimits.canAudit) {
      setError(`You've reached your ${userLimits.plan} plan limit (${userLimits.limit} audits/month). Please upgrade to continue.`);
      return;
    }

    setIsAuditing(true);
    setError("");
    setProgress("Analyzing contract...");

    try {
      const response = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractCode,
          contractName: contractName || "Smart Contract",
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.limitReached) {
          setError(`Free plan limit reached (${data.currentUsage}/3). Please upgrade to continue.`);
          setIsAuditing(false);
          setProgress("");
          return;
        }
        throw new Error(data.error || "Audit failed");
      }

      setProgress("Audit complete! Redirecting to results...");
      
      // Refresh limits after audit
      fetchUserLimits();
      
      setTimeout(() => {
        router.push(`/dashboard/audit/results/${data.audit_id}`);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit");
      setIsAuditing(false);
      setProgress("");
    }
  };

  // Show limit warning banner
  const showLimitWarning = userLimits && userLimits.plan === "FREE" && userLimits.remaining === 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--frost)]">Smart Contract Audit</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Paste your Solidity code below for a comprehensive security analysis
          </p>
        </div>

        {/* Limit Warning Banner */}
        {!loadingLimits && showLimitWarning && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-500">Audit limit reached</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  You've used all {userLimits?.auditsThisMonth}/3 free audits this month.
                  Upgrade your plan to continue auditing.
                </p>
                <button
                  onClick={() => router.push("/dashboard/pricing")}
                  className="mt-2 px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white hover:opacity-90 transition-all"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Info */}
        {!loadingLimits && userLimits && userLimits.plan === "FREE" && userLimits.remaining > 0 && (
          <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-400">
              ✅ Free plan: {userLimits.auditsThisMonth}/3 audits used this month. 
              {userLimits.remaining} {userLimits.remaining === 1 ? 'audit' : 'audits'} remaining.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contract Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Contract Name (optional)
                </label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--plum-light)] transition-all"
                  placeholder="MySmartContract"
                />
              </div>

              {/* Contract Code */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Solidity Code *
                </label>
                <textarea
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--plum-light)] transition-all"
                  placeholder={`pragma solidity ^0.8.0;

contract MyContract {
    // Your Solidity code here
}`}
                  required
                  disabled={showLimitWarning}
                />
              </div>

              {/* Progress/Error Display */}
              {progress && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-blue-400">{progress}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuditing || !contractCode.trim() || showLimitWarning}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running Audit...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Security Audit
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Plans Section - Same as before */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--frost)] mb-4">Select Plan</h3>
            
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <label
                  key={plan.id}
                  className={`block cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "ring-2 ring-[var(--plum-light)]"
                      : "hover:ring-1 hover:ring-[var(--border)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="hidden"
                  />
                  <div className={`relative p-4 rounded-lg border border-[var(--border)] bg-gradient-to-br ${plan.color} ${
                    selectedPlan === plan.id ? "border-[var(--plum-light)]" : ""
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-2 right-4 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-[var(--plum-light)]" />
                          <h4 className="font-semibold text-[var(--frost)]">{plan.name}</h4>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{plan.description}</p>
                      </div>
                      {selectedPlan === plan.id && (
                        <CheckCircle className="w-5 h-5 text-[var(--plum-light)]" />
                      )}
                    </div>
                    
                    <div className="text-2xl font-bold text-[var(--frost)] mb-3">{plan.price}</div>
                    
                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </label>
              );
            })}

            <div className="mt-4 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                🔒 Your code is encrypted and never stored permanently. <br />
                Free plan: 3 audits per month.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}