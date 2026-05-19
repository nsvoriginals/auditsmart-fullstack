import Link from "next/link";
import { Shield } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 px-4 text-center bg-background">
      <div className="w-14 h-14 rounded-2xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center">
        <Shield size={24} className="text-brand" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-sans mb-2">404 — Page not found</h2>
        <p className="text-sm text-text-muted font-sans">
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold font-sans transition-opacity hover:opacity-90"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
