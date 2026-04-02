"use client";
// app/dashboard/audit/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, AlertCircle, CheckCircle, Zap, Shield, Brain, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

interface UserLimits {
  plan: string;
  auditsThisMonth: number;
  limit: number | null;
  remaining: number | null;
  canAudit: boolean;
  isUnlimited: boolean;
}

export default function AuditPage() {
  const router = useRouter();
  const [contractCode, setContractCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);

  useEffect(() => {
    fetchUserLimits();
  }, []);

  const fetchUserLimits = async () => {
    try {
      const response = await fetch("/api/user/limits");
      const data = await response.json();
      if (response.ok) {
        setUserLimits(data);
        if (data.plan === "FREE" && data.remaining === 0) {
          // ✅ Plain string in JS — no HTML entities
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

    if (userLimits && !userLimits.canAudit) {
      // ✅ Plain string in JS — no HTML entities
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

  const showLimitWarning = userLimits && userLimits.plan === "FREE" && userLimits.remaining === 0;
  const usagePercentage =
    userLimits && userLimits.limit
      ? (userLimits.auditsThisMonth / userLimits.limit) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Smart Contract Audit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your Solidity code below for a comprehensive security analysis
        </p>
      </div>

      {/* Limit Warning Banner */}
      {!loadingLimits && showLimitWarning && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-500">Audit limit reached</h3>
              {/* ✅ &apos; is valid here — inside JSX text content */}
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;ve used all {userLimits?.auditsThisMonth}/3 free audits this month.
                Upgrade your plan to continue auditing.
              </p>
              <Button
                variant="link"
                className="px-0 mt-1 h-auto text-yellow-500"
                onClick={() => router.push("/pricing")}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Info */}
      {!loadingLimits && userLimits && userLimits.plan === "FREE" && (userLimits.remaining ?? 0) > 0 && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Free plan: {userLimits.auditsThisMonth}/3 audits used. {userLimits.remaining} remaining.
              </span>
            </div>
            <Progress value={usagePercentage} className="w-32 h-1.5" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Audit Configuration</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Contract Name (optional)
                </label>
                <Input
                  placeholder="MySmartContract"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Solidity Code *
                </label>
                <Textarea
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  rows={12}
                  className="font-mono text-sm bg-background"
                  placeholder={`pragma solidity ^0.8.0;\n\ncontract MyContract {\n    // Your Solidity code here\n}`}
                  required
                  disabled={!!showLimitWarning}
                />
              </div>

              {progress && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-blue-400">{progress}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isAuditing || !contractCode.trim() || !!showLimitWarning}
                className="w-full bg-gradient-to-r from-[var(--plum)] to-[var(--plum-light)] hover:opacity-90"
                size="lg"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Audit...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Security Audit
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Plans Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Select Plan</h3>

          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;

              return (
                <label
                  key={plan.id}
                  className={cn(
                    "relative block cursor-pointer transition-all",
                    isSelected && "ring-2 ring-[var(--plum-light)] rounded-lg"
                  )}
                >
                  <RadioGroupItem value={plan.id} className="sr-only" />
                  <div
                    className={cn(
                      "p-4 rounded-lg border border-border bg-gradient-to-br",
                      plan.color,
                      isSelected && "border-[var(--plum-light)]"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-[var(--plum-light)]" />
                        <div>
                          <h4 className="font-semibold text-foreground">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-[var(--plum-light)]" />}
                    </div>

                    <div className="text-2xl font-bold text-foreground mb-3">
                      {plan.price}
                      <span className="text-xs font-normal text-muted-foreground">/month</span>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {plan.popular && (
                      <div className="absolute -top-2 right-4 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                        POPULAR
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <p className="text-xs text-muted-foreground">
              Your code is encrypted and never stored permanently.
              <br />
              Free plan: 3 audits per month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}