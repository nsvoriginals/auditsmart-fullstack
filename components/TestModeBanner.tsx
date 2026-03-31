// components/TestModeBanner.tsx
"use client";

import { isTestMode, getTestCardDetails } from "@/lib/config";
import { AlertCircle } from "lucide-react";

export default function TestModeBanner() {
  if (!isTestMode()) return null;
  
  const testDetails = getTestCardDetails();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-500/95 backdrop-blur-sm rounded-lg shadow-xl p-4 border border-yellow-400">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-900 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 text-sm">🧪 TEST MODE</h4>
            <p className="text-xs text-yellow-800 mt-1">
              No real payments are processed. Use test cards:
            </p>
            <div className="mt-2 space-y-1">
              {testDetails?.cards.map((card, i) => (
                <p key={i} className="text-xs font-mono text-yellow-800">
                  {card.number} — {card.name}
                </p>
              ))}
              <p className="text-xs text-yellow-800 mt-1">
                CVV: Any 3 digits • Expiry: Any future date
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}