// Clerk → NextAuth compatibility shim for the ported landing components.
// Sentinel OS used Clerk's <Show>, <SignInButton>, <SignUpButton>. AuditSmart
// uses NextAuth, so these map to useSession()/signIn() and the existing auth
// pages. Landing is not route-mounted in this port, but components/ is
// type-checked, so these keep the landing source compiling.
"use client";

import * as React from "react";
import { useSession, signIn } from "next-auth/react";

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const authed = status === "authenticated";
  if (when === "signed-in" && authed) return <>{children}</>;
  if (when === "signed-out" && !authed) return <>{children}</>;
  return null;
}

type AuthButtonProps = {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
  [key: string]: unknown;
};

export function SignInButton({ children }: AuthButtonProps) {
  return (
    <span className="contents" onClick={() => signIn(undefined, { callbackUrl: "/workspace" })}>
      {children}
    </span>
  );
}

export function SignUpButton({ children }: AuthButtonProps) {
  return (
    <span
      className="contents"
      onClick={() => {
        window.location.href = "/register?callbackUrl=/workspace";
      }}
    >
      {children}
    </span>
  );
}
