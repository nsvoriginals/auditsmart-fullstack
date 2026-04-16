"use client";
import * as React from "react";
import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { LoaderCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Plan display names and prices (in INR for display)
const PLAN_DETAILS: Record<string, { name: string; displayPrice: number; amountInPaise: number }> = {
  pro: { name: "Pro", displayPrice: 2499, amountInPaise: 249900 },
  enterprise: { name: "Enterprise", displayPrice: 4199, amountInPaise: 419900 },
  deep_audit: { name: "Deep Audit", displayPrice: 1699, amountInPaise: 169900 },
};

// TEST MODE - Set to true for testing with ₹1 amounts
const TEST_MODE = true;

function CheckoutContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useSearchParams();
  
  const planParam = params.get("plan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=/checkout?plan=${planParam}`);
    }
  }, [status, router, planParam]);

  // Validate plan
  const plan = planParam?.toLowerCase() || "";
  const planDetails = PLAN_DETAILS[plan];
  
  useEffect(() => {
    if (plan && !planDetails) {
      router.replace("/pricing");
    }
  }, [plan, planDetails, router]);

  const createOrder = useCallback(async (): Promise<string | null> => {
    try {
      const amount = TEST_MODE 
        ? (plan === "pro" ? 100 : plan === "enterprise" ? 200 : 300) // ₹1, ₹2, ₹3 for testing
        : planDetails?.amountInPaise;

      const response = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = await response.json();
      return data.order_id;
    } catch (err) {
      console.error("Order creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create order");
      return null;
    }
  }, [plan, planDetails]);

  const handlePayment = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=/checkout?plan=${plan}`);
      return;
    }

    setLoading(true);
    setError(null);

    const orderId = await createOrder();
    
    if (!orderId) {
      setLoading(false);
      return;
    }

    const amount = TEST_MODE
      ? (plan === "pro" ? 100 : plan === "enterprise" ? 200 : 300)
      : planDetails?.amountInPaise;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount,
      currency: "INR",
      name: "AuditSmart",
      description: `${planDetails?.name} Plan - AI Smart Contract Audits`,
      order_id: orderId,
      handler: async (response: any) => {
        try {
          const verifyRes = await fetch("/api/payment/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            setSuccess(true);
            
            // Refresh session to update user role
            await fetch("/api/auth/session?update");
            
            // Redirect after 2 seconds
            setTimeout(() => {
              router.push(`/success?plan=${plan}&payment_id=${response.razorpay_payment_id}`);
            }, 2000);
          } else {
            setError(verifyData.error || "Payment verification failed");
          }
        } catch (err) {
          console.error("Verification error:", err);
          setError("Payment verification failed. Please check your email for confirmation.");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: session.user?.name || "",
        email: session.user?.email || "",
      },
      theme: {
        color: "#3B82F6",
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setError("Payment cancelled. You can try again anytime.");
        },
      },
    };

    try {
      const razorpay = new (window as any).Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      setError("Failed to open payment window. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading" || !planDetails) {
    return (
      <div className="container h-screen flex justify-center items-center">
        <LoaderCircle className="animate-spin h-20 w-20 text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <section className="container h-screen flex flex-col justify-center items-center gap-6">
        <CheckCircle className="h-20 w-20 text-green-500 animate-pulse" />
        <h1 className="text-3xl font-bold text-center">Payment Successful!</h1>
        <p className="text-gray-400">Redirecting to confirmation page...</p>
      </section>
    );
  }

  const displayAmount = TEST_MODE 
    ? (plan === "pro" ? 1 : plan === "enterprise" ? 2 : 3)
    : planDetails.displayPrice;

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <section className="container min-h-screen flex flex-col justify-center items-center gap-8 py-10">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Complete Your Purchase
        </h1>

        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl">{planDetails.name} Plan</CardTitle>
            <CardDescription>
              {TEST_MODE && (
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded-full border border-yellow-600">
                  ⚠️ TEST MODE - Amount: ₹{displayAmount}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-gray-700">
              <span className="text-gray-400">Plan</span>
              <span className="font-medium">{planDetails.name}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-gray-700">
              <span className="text-gray-400">Billing</span>
              <span className="font-medium">
                {plan === "deep_audit" ? "One-time payment" : "Monthly subscription"}
              </span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">
                ₹{displayAmount.toLocaleString('en-IN')}
                {plan !== "deep_audit" && <span className="text-sm font-normal text-gray-400">/mo</span>}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ₹${displayAmount.toLocaleString('en-IN')}`
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Secure payment powered by Razorpay. By completing this purchase, you agree to our Terms of Service.
            </p>
          </CardFooter>
        </Card>

        <Button variant="link" onClick={() => router.back()}>
          ← Go back
        </Button>
      </section>
    </>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="container h-screen flex justify-center items-center">
      <LoaderCircle className="animate-spin h-20 w-20 text-primary" />
    </div>
  );
}