// lib/config.ts - Updated with correct plan limits

// Payment Configuration
export const config = {
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_TEST_MODE: process.env.RAZORPAY_TEST_MODE !== 'false', // Default to true
  
  // API Keys for AI Agents
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  // Claude Models
  CLAUDE_HAIKU_MODEL: process.env.CLAUDE_HAIKU_MODEL || 'claude-3-5-haiku-20241022',
  CLAUDE_SONNET_MODEL: process.env.CLAUDE_SONNET_MODEL || 'claude-3-5-sonnet-20241022',
  CLAUDE_OPUS_MODEL: process.env.CLAUDE_OPUS_MODEL || 'claude-3-opus-20240229',
  
  // Gemini Model
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  
  // Groq Model
  GROQ_MODEL: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
  
  // Timeouts (in seconds)
  AGENT_TIMEOUT_SECONDS: parseInt(process.env.AGENT_TIMEOUT_SECONDS || '60'),
  CLAUDE_TIMEOUT_SECONDS: parseInt(process.env.CLAUDE_TIMEOUT_SECONDS || '180'),
  
  // Token Limits
  GROQ_MAX_TOKENS: parseInt(process.env.GROQ_MAX_TOKENS || '4000'),
  GEMINI_MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '8000'),
  
  // PDF Generation
  PDF_ENABLED: process.env.PDF_ENABLED === 'true',
  
  // Risk Thresholds for Scoring
  RISK_THRESHOLDS: {
    critical: 80,
    high: 60,
    medium: 35,
    low: 10,
  },
};

// Plan Prices (in paise) - TEST MODE PRICES (₹1, ₹2, ₹3)
// 1 Rupee = 100 paise
export const PLAN_PRICES_PAISE = {
  free: 0,
  pro: 100,           // ₹1.00 (TESTING)
  enterprise: 200,    // ₹2.00 (TESTING)
  deep_audit: 300,    // ₹3.00 (TESTING)
};

// Production prices (commented for reference)
// export const PLAN_PRICES_PAISE = {
//   free: 0,
//   pro: 99000,        // ₹990
//   enterprise: 499000, // ₹4,990
//   deep_audit: 165000, // ₹1,650
// };

// Plan Features - UPDATED with correct limits from briefing
export const PLAN_FEATURES = {
  free: [
    "10 audits lifetime",  // ✅ Fixed from "3 audits per month"
    "Groq AI analysis",
    "Basic vulnerability detection",
    "PDF audit report",
    "Community support",
  ],
  pro: [
    "15 audits per month",  // ✅ Fixed from 10
    "Groq + Claude Haiku AI",
    "Advanced vulnerability detection",
    "PDF audit reports",
    "Fix suggestions with code",
    "Deployment verdict",
    "Email support",
  ],
  enterprise: [
    "20 audits per month",  // ✅ Fixed from unlimited
    "Groq + Claude Sonnet AI",
    "Full exploit scenarios",
    "Production-ready fix code",
    "Deployment verdict",
    "API access",
    "Priority 24/7 support",
  ],
  deep_audit: [
    "Unlimited audits",  // ✅ Deep Audit has unlimited
    "Claude Opus AI (most powerful)",
    "Extended Thinking - see AI reasoning chain",
    "Full exploit scenario for every critical/high finding",
    "Production-ready patched code snippets",
    "Deployment verdict: SAFE / CAUTION / DO NOT DEPLOY",
    "Priority processing (2x faster)",
    "PDF report with detailed analysis",
  ],
};

// Helper to get formatted price display
export function getFormattedPrice(plan: keyof typeof PLAN_PRICES_PAISE): string {
  const paise = PLAN_PRICES_PAISE[plan];
  if (paise === 0) return "Free";
  
  const rupees = paise / 100;
  
  // For testing mode with small amounts
  if (config.RAZORPAY_TEST_MODE && rupees < 10) {
    return `₹${rupees}`;
  }
  
  // For production
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(0)}K`;
  }
  
  return `₹${rupees}`;
}

// Helper to check if in test mode
export function isTestMode(): boolean {
  return config.RAZORPAY_TEST_MODE;
}

// Helper to get test card details for UI
export function getTestCardDetails() {
  if (!config.RAZORPAY_TEST_MODE) return null;
  
  return {
    cards: [
      { number: "4111 1111 1111 1111", name: "Visa (Success)", message: "Payment successful" },
      { number: "4242 4242 4242 4242", name: "Visa (Success)", message: "Payment successful" },
      { number: "5555 5555 5555 4444", name: "Mastercard (Success)", message: "Payment successful" },
      { number: "2223 0000 1000 0005", name: "Mastercard (3D Secure)", message: "Requires OTP authentication" },
    ],
    message: "🔧 TEST MODE: Use any test card. No real payment will be charged.",
    cvv: "Any 3 digits",
    expiry: "Any future date",
  };
}

// Agent Configuration for 8 Specialized Groq Agents
export const AGENT_CONFIGS = [
  {
    name: "reentrancy_agent",
    focus: `Reentrancy attacks: Check EVERY function that makes external calls (call, send, transfer). 
      Is state updated BEFORE or AFTER the call? Check for cross-function reentrancy. 
      Check if nonReentrant modifier is applied to ALL functions that need it. 
      If a function already has nonReentrant, do NOT report reentrancy for it.`
  },
  {
    name: "overflow_agent",
    focus: `Integer overflow/underflow: Check all arithmetic operations. 
      Look for 'unchecked' blocks that bypass Solidity 0.8+ protections. 
      Check division by zero. Check precision loss in calculations. 
      Check share rounding to zero attacks.`
  },
  {
    name: "access_control_agent",
    focus: `Access control: Check EVERY public/external function. 
      Can anyone call pause/unpause? Can anyone call initialize? 
      Is ownership transfer single-step or two-step? 
      Can owner set fees above 100%? Are there unused state variables like pendingOwner?`
  },
  {
    name: "logic_agent",
    focus: `Business logic flaws: Check deposit/withdraw accounting. 
      Can emergency withdraw break accounting? 
      Check share price manipulation — can first depositor inflate share price? 
      Check flash loan repayment logic. Can ETH sent via selfdestruct bypass balance checks?`
  },
  {
    name: "gas_dos_agent",
    focus: `Gas griefing and DoS: Check for unbounded arrays. 
      Check loops over arrays with external calls. 
      Check reward distribution over all depositors. 
      Check silent transfer failures — are failed ETH sends ignored?`
  },
  {
    name: "defi_agent",
    focus: `DeFi vulnerabilities: Check oracle manipulation. 
      Is price oracle validated? Is there staleness checking? 
      Check MEV/sandwich attack vectors. 
      Check if receive()/fallback() accept ETH without accounting. 
      Check unsafe ERC20 — does transferFrom check return value?`
  },
  {
    name: "backdoor_agent",
    focus: `BACKDOOR DETECTION — CRITICAL: 
      1) selfdestruct — lets owner drain all funds. 
      2) delegatecall to arbitrary addresses. 
      3) arbitrary calldata in governance proposals. 
      4) quorum = 1 vote to pass proposals. 
      5) migration functions that move all funds. 
      Report ALL as CRITICAL severity.`
  },
  {
    name: "signature_agent",
    focus: `Signature vulnerabilities: 
      1) ecrecover — does it verify signer != address(0)? 
      2) Replay protection — is there a nonce? 
      3) Cross-chain replay — is chainId included? 
      4) abi.encodePacked with variable-length types — hash collisions. 
      5) EIP-712 compliance.`
  },
];

// Plan-specific orchestrator configuration
export const ORCHESTRATOR_CONFIG = {
  free: {
    name: "Gemini",
    model: "gemini-1.5-pro",
    description: "Free plan uses Gemini for orchestration",
  },
  pro: {
    name: "Claude Haiku",
    model: "claude-3-5-haiku-20241022",
    description: "Fast and cost-effective orchestration",
    features: ["Fix suggestions", "Finding validation"],
  },
  enterprise: {
    name: "Claude Sonnet",
    model: "claude-3-5-sonnet-20241022",
    description: "Deep analysis with exploit scenarios",
    features: ["Exploit scenarios", "Fix code snippets", "Cross-contract analysis"],
  },
  deep_audit: {
    name: "Claude Opus",
    model: "claude-3-opus-20240229",
    description: "Maximum intelligence with extended thinking",
    features: ["Extended thinking chain", "Full exploit scenarios", "Deployment verdict", "Priority processing"],
  },
};

// Audit status types
export const AUDIT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

// Finding severity levels
export const SEVERITY_LEVELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
} as const;

// Severity scores for risk calculation
export const SEVERITY_SCORES = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
  info: 0,
};

// Helper function to get plan price
export function getPlanPrice(plan: keyof typeof PLAN_PRICES_PAISE): number {
  return PLAN_PRICES_PAISE[plan] || 0;
}

// Helper function to get plan features
export function getPlanFeatures(plan: keyof typeof PLAN_FEATURES): string[] {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}

// Helper function to check if plan requires payment
export function isPaidPlan(plan: string): boolean {
  return plan !== "free" && PLAN_PRICES_PAISE[plan as keyof typeof PLAN_PRICES_PAISE] > 0;
}

// Helper to get orchestrator config for a plan
export function getOrchestratorConfig(plan: string) {
  return ORCHESTRATOR_CONFIG[plan as keyof typeof ORCHESTRATOR_CONFIG] || ORCHESTRATOR_CONFIG.free;
}