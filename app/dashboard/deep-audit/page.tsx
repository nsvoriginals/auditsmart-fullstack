// app/dashboard/deep-audit/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PLAN_DETAILS } from "@/lib/plans";
import {
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileCode,
  Brain,
  Search,
  FileText,
  CreditCard,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureVault {
    mapping(address => uint256) public balances;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
}`;

export default function DeepAuditPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [contractCode, setContractCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "processing" | "complete">("form");

  const loadSample = () => {
    setContractCode(SAMPLE_CONTRACT);
    setContractName("SecureVault");
  };

  const validateForm = () => {
    if (!contractCode.trim()) {
      setError("Please enter contract code");
      return false;
    }
    if (contractCode.length > 50000) {
      setError("Contract code exceeds 50,000 character limit");
      return false;
    }
    if (!contractName.trim()) {
      setContractName("Smart Contract");
    }
    return true;
  };

  const createOrder = async () => {
    try {
      const res = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "deep_audit" }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Payment initialization failed");
    }
  };

  const runDeepAudit = async (orderId: string, paymentId: string, signature: string) => {
    const res = await fetch("/api/audit/deep/verify-and-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        contract_code: contractCode,
        contract_name: contractName || "Smart Contract",
        chain,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Audit failed");
    return data;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const order = await createOrder();
      
      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }
      
      // ⭐ COMPLETE RAZORPAY OPTIONS WITH UPI ID INPUT FIELD
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AuditSmart",
        description: "Deep Audit - Advanced AI Security Analysis",
        order_id: order.order_id,

        // ✅ Enable all payment methods
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },

        // ✅ CRITICAL: This enables the UPI ID input field
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI",
                instruments: [
                  {
                    method: "upi",
                    flow: "collect"  // ⭐ THIS ENABLES UPI ID INPUT FIELD
                  }
                ]
              }
            },
            sequence: ["block.upi"], // Show UPI first
            preferences: {
              show_default_blocks: true
            }
          }
        },

        // ✅ Prefill user data and test UPI ID
        prefill: {
          name:  session?.user?.name  || "",
          email: session?.user?.email || "",
        },

        // ✅ Theme
        theme: {
          color: "#6366f1"
        },

        // ✅ Payment success handler
        handler: async (response: any) => {
          setStep("processing");

          try {
            // verify-and-run is synchronous — it awaits the full pipeline and
            // returns the completed audit result directly. No polling needed.
            const auditResult = await runDeepAudit(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            setStep("complete");
            router.push(`/dashboard/audit/results/${auditResult.audit_id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Audit failed");
            setStep("form");
          }
        },

        // ✅ Modal close handler
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled");
          },
        },
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "processing") {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 60, height: 60, border: "4px solid var(--border)",
          borderTopColor: "var(--brand)", borderRadius: "50%",
          animation: "spin 1s linear infinite", margin: "0 auto 24px",
        }} />
        <h2 style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 700, marginBottom: 12 }}>
          Running Deep Audit
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Claude Opus + extended thinking is analyzing your contract. This takes 30–90 seconds.
        </p>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--brand-purple), var(--brand))",
              borderRadius: 2,
              animation: "progress-indeterminate 1.5s ease-in-out infinite",
              width: "40%",
            }} />
          </div>
          <style>{`
            @keyframes progress-indeterminate {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
          `}</style>
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-disabled)" }}>
            Please don't close this page.
          </p>
        </div>
      </div>
    );
  }
  
  if (step === "complete") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
        <CheckCircle size={64} style={{ color: "#10b981", marginBottom: 24 }} />
        <h2 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 700, marginBottom: 12 }}>
          Deep Audit Complete!
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Your contract has been analyzed. Redirecting to results...
        </p>
        <div style={{
          width: 24, height: 24, border: "2px solid var(--border)",
          borderTopColor: "var(--brand)", borderRadius: "50%",
          animation: "spin 1s linear infinite", margin: "0 auto"
        }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus, input:focus, select:focus { outline: none; border-color: var(--brand) !important; }
      `}</style>
      
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Zap size={20} style={{ color: "var(--brand-pink)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-pink)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Premium Feature
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8 }}>
          Deep Security Audit
        </h1>
        <p style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "var(--text-muted)" }}>
          Advanced AI-powered audit for comprehensive smart contract security analysis.
        </p>
      </div>
      
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.05))",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>One-time payment</div>
          <div style={{ fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 800 }}>
            ${PLAN_DETAILS.deep_audit.displayPrice.toLocaleString("en-US")}
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}> / audit</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ padding: "6px 12px", background: "rgba(99,102,241,0.1)", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <Brain size={12} /> Claude Opus
          </div>
          <div style={{ padding: "6px 12px", background: "rgba(99,102,241,0.1)", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <Search size={12} /> 10+ Agents
          </div>
          <div style={{ padding: "6px 12px", background: "rgba(99,102,241,0.1)", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <FileText size={12} /> PDF Report
          </div>
        </div>
      </div>
      
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "clamp(20px, 5vw, 28px)",
      }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
            Contract Name
          </label>
          <input
            type="text"
            placeholder="e.g., MyToken, Vault, StakingContract"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
            Blockchain Network
          </label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="bsc">BNB Chain</option>
            <option value="avalanche">Avalanche</option>
            <option value="base">Base</option>
          </select>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
              Solidity Contract Code
            </label>
            <button
              onClick={loadSample}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none",
                color: "var(--brand)", fontSize: 11, cursor: "pointer",
              }}
            >
              <FileCode size={12} /> Load Sample
            </button>
          </div>
          <textarea
            rows={14}
            placeholder="// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // Your code here
}"
            value={contractCode}
            onChange={(e) => setContractCode(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: 12,
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: contractCode.length > 50000 ? "#ef4444" : "var(--text-disabled)" }}>
            {contractCode.length.toLocaleString()} / 50,000 characters
          </div>
        </div>
        
        {error && (
          <div style={{
            marginBottom: 20,
            padding: "12px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
          </div>
        )}
        
        <button
          onClick={handlePayment}
          disabled={loading || !contractCode.trim()}
          style={{
            width: "100%",
            padding: "14px 0",
            background: loading || !contractCode.trim() ? "var(--elevated)" : "linear-gradient(135deg, var(--brand-purple), var(--brand))",
            color: loading || !contractCode.trim() ? "var(--text-disabled)" : "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !contractCode.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
          ) : (
            <>Pay ${PLAN_DETAILS.deep_audit.displayPrice.toLocaleString("en-US")} <CreditCard size={14} /> <ArrowRight size={14} /></>
          )}
        </button>
        
        <p style={{ marginTop: 16, fontSize: 11, color: "var(--text-disabled)", textAlign: "center" }}>
          Secure payment powered by Razorpay · Cards, UPI &amp; netbanking accepted
        </p>
      </div>
    </div>
  );
}