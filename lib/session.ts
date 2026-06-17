// lib/session.ts
import { cache } from "react";
import { getServerSession } from "@/lib/auth-server";
import { authOptions } from "@/lib/auth";

// cache() deduplicates calls within a single RSC render pass.
// If layout AND page both call getCachedSession(), the auth provider
// is only hit once — the second call returns the memoised result.
export const getCachedSession = cache(() => getServerSession(authOptions));
