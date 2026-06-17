import { getServerSession } from "@/lib/auth-server";
import { authOptions } from "@/lib/auth";

/**
 * Resolve the current workspace user id from the NextAuth session.
 * Returns null when unauthenticated (caller should respond 401).
 */
export async function getWorkspaceUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
