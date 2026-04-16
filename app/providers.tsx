"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Accept server-side session so SessionProvider pre-populates the cache.
// Without this, every "use client" page fires GET /api/auth/session on mount
// before it can render — that's the 3-second delay.
export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}