// lib/plans.ts

export type PublicPlan = "free" | "pro" | "enterprise" | "deep_audit";
export type UserPlan = "FREE" | "PREMIUM" | "ENTERPRISE" | "ADMIN";

export const IS_PRODUCTION_PRICING =
  process.env.NEXT_PUBLIC_PRODUCTION_MODE === "true";

export const PLAN_DETAILS = {
  free: {
    id: "free",
    name: "Free",
    monthly: false,
    amountInPaise: 0,
    displayPrice: 0,        // USD display price
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthly: true,
    amountInPaise: IS_PRODUCTION_PRICING ? 159900 : 100,  // ₹1,599 / charged via Razorpay
    displayPrice:  IS_PRODUCTION_PRICING ? 19      : 1,   // $19    / shown to user
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthly: true,
    amountInPaise: IS_PRODUCTION_PRICING ? 249900 : 200,  // ₹2,499
    displayPrice:  IS_PRODUCTION_PRICING ? 29      : 2,   // $29
  },
  deep_audit: {
    id: "deep_audit",
    name: "Deep Audit",
    monthly: false,
    amountInPaise: IS_PRODUCTION_PRICING ? 169900 : 300,  // ₹1,699
    displayPrice:  IS_PRODUCTION_PRICING ? 20      : 3,   // $20
  },
} as const;

export const PLAN_FEATURES: Record<PublicPlan, string[]> = {
  free: [
    "10 audits lifetime",
    "Groq AI analysis",
    "Basic vulnerability detection",
    "PDF audit report",
    "Community support",
  ],
  pro: [
    "15 audits per month",
    "Groq + Claude Haiku AI",
    "Advanced vulnerability detection",
    "PDF audit reports",
    "Fix suggestions",
    "Deployment verdict",
    "Email support",
  ],
  enterprise: [
    "20 audits per month",
    "Groq + Claude Sonnet AI",
    "Full exploit scenarios",
    "Production-ready fix code",
    "Deployment verdict",
    "API access",
    "Priority support",
  ],
  deep_audit: [
    "One-time deep analysis",
    "Claude Opus + extended thinking",
    "Full exploit scenarios",
    "Production-ready patched code",
    "Deployment verdict",
    "Priority processing",
    "PDF report",
  ],
};

export const PLAN_LIMITS: Record<UserPlan, number> = {
  FREE: 10,
  PREMIUM: 15,
  ENTERPRISE: 20,
  ADMIN: Number.POSITIVE_INFINITY,
};

export function isPublicPlan(value: string): value is PublicPlan {
  return value in PLAN_DETAILS;
}

export function getPublicPlanDetails(plan: string) {
  return isPublicPlan(plan) ? PLAN_DETAILS[plan] : null;
}

export function getAuditLimitForPlan(plan: string): number {
  return PLAN_LIMITS[(plan || "FREE").toUpperCase() as UserPlan] ?? PLAN_LIMITS.FREE;
}

export function isLifetimeLimitedPlan(plan: string): boolean {
  return plan.toUpperCase() === "FREE";
}

/**
 * FIX: deep_audit was incorrectly mapped to PREMIUM (same as pro).
 * deep_audit is a one-time purchase that grants ENTERPRISE-level access
 * for that single audit. Map it to ENTERPRISE so limits/orchestrator match.
 */
export function mapPublicPlanToUserPlan(plan: PublicPlan): UserPlan {
  switch (plan) {
    case "pro":
      return "PREMIUM";
    case "enterprise":
      return "ENTERPRISE";
    case "deep_audit":
      return "ENTERPRISE"; // ← FIXED: was PREMIUM, but deep_audit uses Opus (enterprise-tier)
    default:
      return "FREE";
  }
}