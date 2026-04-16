"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, LoaderCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAN_NAMES: Record<string, string> = {
  pro: "Pro",
  enterprise: "Enterprise",
  deep_audit: "Deep Audit",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const plan = searchParams.get("plan") || "";
  const paymentId = searchParams.get("payment_id") || "";
  const planName = PLAN_NAMES[plan] || "Premium";
  
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!plan) {
      router.replace("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard/audit");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, plan]);

  const copyPaymentId = () => {
    if (paymentId) {
      navigator.clipboard.writeText(paymentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              Thank you for upgrading to <span className="text-white font-semibold">{planName}</span>!
            </p>
            <p className="text-sm text-gray-500">
              Your account has been upgraded and you can now start auditing your smart contracts.
            </p>
          </div>

          {paymentId && (
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Payment Reference</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-gray-300 truncate">
                  {paymentId.slice(0, 16)}...
                </code>
                <button
                  onClick={copyPaymentId}
                  className="p-1 hover:bg-gray-700 rounded transition"
                  title="Copy payment ID"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/dashboard/audit">
              <Button className="w-full group">
                Start Auditing Now
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Redirecting to audit page in {countdown} seconds...
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Need help?{" "}
          <Link href="/support" className="text-blue-400 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex justify-center items-center">
      <LoaderCircle className="animate-spin h-12 w-12 text-primary" />
    </div>
  );
}