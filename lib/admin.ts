// lib/admin.ts — server-only. Shared admin auth helpers.
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export type AdminSession = {
  userId: string;
  email:  string;
  name:   string | null;
};

/**
 * For server components/pages. Returns null if the caller is not an admin.
 * Callers decide what to do (redirect, render 403, etc.).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if ((session.user.role ?? "").toUpperCase() !== "ADMIN") return null;
  return {
    userId: session.user.id,
    email:  session.user.email,
    name:   session.user.name ?? null,
  };
}

/**
 * For API route handlers. Returns either the admin session (success) or a
 * NextResponse to return immediately (401 / 403).
 *
 *   const auth = await requireAdminApi();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.userId is the admin id
 */
export async function requireAdminApi(): Promise<AdminSession | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user.role ?? "").toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return {
    userId: session.user.id,
    email:  session.user.email,
    name:   session.user.name ?? null,
  };
}
