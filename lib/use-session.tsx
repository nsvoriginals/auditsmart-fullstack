// Clerk-backed drop-in for next-auth/react's useSession / signIn / signOut.
// Mirrors the { data, status } shape so existing client call sites work with a
// one-line import swap. Note: client-side `user.id` is the Clerk id (the DB id
// is resolved server-side via getServerSession); client usage is display/gating.
"use client";

import { useUser } from "@clerk/nextjs";

export interface CompatClientSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
    plan?: string;
  };
}

type UseSessionReturn = {
  data: CompatClientSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: (...args: unknown[]) => Promise<CompatClientSession | null>;
};

export function useSession(): UseSessionReturn {
  const { isLoaded, isSignedIn, user } = useUser();
  const update = async () => null;
  if (!isLoaded) return { data: null, status: "loading", update };
  if (!isSignedIn || !user) return { data: null, status: "unauthenticated", update };
  const role = (user.publicMetadata?.role as string | undefined) ?? undefined;
  return {
    data: {
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? null,
        name: user.fullName ?? user.username ?? null,
        image: user.imageUrl ?? null,
        role,
        plan: role,
      },
    },
    status: "authenticated",
    update,
  };
}

/** Redirect to the Clerk sign-in page (compat for next-auth signIn). */
export function signIn(_provider?: string, opts?: { callbackUrl?: string }) {
  const cb = opts?.callbackUrl ? `?redirect_url=${encodeURIComponent(opts.callbackUrl)}` : "";
  window.location.href = `/login${cb}`;
}

/** Sign out via the global Clerk instance (compat for next-auth signOut). */
export async function signOut(opts?: { callbackUrl?: string }) {
  const w = window as unknown as { Clerk?: { signOut: (o?: { redirectUrl?: string }) => Promise<void> } };
  if (w.Clerk?.signOut) {
    await w.Clerk.signOut({ redirectUrl: opts?.callbackUrl ?? "/" });
  } else {
    window.location.href = opts?.callbackUrl ?? "/";
  }
}
