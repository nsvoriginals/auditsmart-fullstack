"use client";

// Auth is handled by Clerk (<ClerkProvider> in app/layout.tsx). This wrapper
// now just mounts global client UI (TrialPopup) alongside the app.
import { TrialPopup } from "@/components/TrialPopup";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TrialPopup />
    </>
  );
}
