// Clerk-backed drop-in replacement for NextAuth's getServerSession.
// Returns the same `{ user: { id, email, name, image, role, plan } }` shape the
// app already expects, mapping the Clerk user to a row in our `User` table
// (get-or-create, linked via clerkId / email). This lets the existing ~17
// server call sites keep working with a one-line import swap.
import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface CompatSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
    plan?: string;
  };
}

/** Ensure a DB User exists for the current Clerk user; returns it (or null). */
export async function syncClerkUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (user) return user;

  // First time we've seen this Clerk user — link by email or create.
  const cu = await currentUser();
  const email =
    cu?.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress;
  if (!email) return null;

  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.username || null;
  const image = cu?.imageUrl ?? null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { clerkId: userId, image: existing.image ?? image },
    });
  } else {
    user = await prisma.user.create({
      data: { clerkId: userId, email, name, image },
    });
  }
  return user;
}

/**
 * Drop-in for NextAuth's `getServerSession(authOptions)`. The argument is
 * accepted and ignored for source-compatibility.
 */
export async function getServerSession(_authOptions?: unknown): Promise<CompatSession | null> {
  const user = await syncClerkUser();
  if (!user) return null;
  const plan = (user.role || "FREE").toString();
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role as unknown as string,
      plan,
    },
  };
}
