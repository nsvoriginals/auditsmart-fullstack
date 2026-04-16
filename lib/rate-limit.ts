// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Audit rate limiter: 5 requests per hour per IP
export const auditRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'audit_ratelimit',
    })
  : null;

// Auth rate limiter: 10 requests per minute per IP
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'auth_ratelimit',
    })
  : null;

// Payment rate limiter: 5 requests per minute per user
export const paymentRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'payment_ratelimit',
    })
  : null;

/**
 * In-memory fallback rate limiter for local dev / when Redis is not configured.
 *
 * FIX: Removed the `setInterval` cleanup that was previously at module level.
 * In Next.js serverless functions each invocation is a fresh process, so the
 * interval never fires in production and wastes memory in long-running dev
 * servers. Cleanup is now done lazily on every call — expired entries are
 * pruned inline before the lookup, which is cheap and works correctly in both
 * serverless and long-running environments.
 */
const memoryCache = new Map<string, { count: number; resetAt: number }>();

export function memoryRateLimit(
  key: string,
  limit = 5,
  windowMs = 60 * 60 * 1000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();

  // Lazy cleanup: remove a small batch of expired keys on each call
  // so the map doesn't grow unbounded in long-running dev servers.
  if (memoryCache.size > 500) {
    for (const [k, v] of memoryCache) {
      if (v.resetAt < now) memoryCache.delete(k);
    }
  }

  const cached = memoryCache.get(key);

  if (!cached || now > cached.resetAt) {
    memoryCache.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (cached.count >= limit) {
    return { success: false, remaining: 0, reset: cached.resetAt };
  }

  cached.count += 1;
  return { success: true, remaining: limit - cached.count, reset: cached.resetAt };
}