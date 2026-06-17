// Clerk → NextAuth adapter for the ported workspace.
//
// Sentinel OS used `useAuth()` from @clerk/nextjs, which exposes
// `{ getToken, isSignedIn, isLoaded }` and relied on bearer tokens.
// AuditSmart uses NextAuth with same-origin API routes, so auth rides the
// session cookie — `getToken` is therefore a no-op (returns null) and the
// axios client sends `withCredentials: true`.
"use client";

import { useSession } from "next-auth/react";

export interface WorkspaceAuth {
  isLoaded: boolean;
  isSignedIn: boolean;
  /** No-op: same-origin requests authenticate via the NextAuth session cookie. */
  getToken: () => Promise<string | null>;
  userId: string | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function useWorkspaceAuth(): WorkspaceAuth {
  const { data: session, status } = useSession();

  const isLoaded = status !== "loading";
  const isSignedIn = status === "authenticated";
  const user = session?.user
    ? {
        id: (session.user as { id?: string }).id ?? "",
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;

  return {
    isLoaded,
    isSignedIn,
    getToken: async () => null,
    userId: user?.id ?? null,
    user,
  };
}

// Compatibility alias so files ported verbatim can keep `useAuth()` calls
// with minimal diff.
export const useAuth = useWorkspaceAuth;
