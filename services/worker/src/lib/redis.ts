// services/worker/src/lib/redis.ts
import IORedis, { type RedisOptions } from 'ioredis';
import { logger } from './logger';

function parseRedisUrl(url: string): RedisOptions {
  const u = new URL(url);
  return {
    host:           u.hostname,
    port:           Number(u.port) || 6379,
    password:       u.password ? decodeURIComponent(u.password) : undefined,
    db:             u.pathname ? Number(u.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,     // required by BullMQ
    enableReadyCheck:     false,    // required by BullMQ
    lazyConnect:          true,
  };
}

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL environment variable is required');

/** Shared Redis connection for BullMQ workers (maxRetriesPerRequest = null). */
export const redisConnection = new IORedis(parseRedisUrl(REDIS_URL));

redisConnection.on('error', (err) => logger.error({ err }, '[redis] connection error'));
redisConnection.on('connect', () => logger.info('[redis] connected'));

/** Separate connection for cache reads/writes (standard settings). */
export const cacheRedis = new IORedis({
  ...parseRedisUrl(REDIS_URL),
  maxRetriesPerRequest: 3,
  enableReadyCheck:     true,
});

export const CACHE_TTL = {
  similaritySearch: 60 * 60,       // 1 hour
  embeddingVector:  60 * 60 * 24,  // 24 hours
} as const;
