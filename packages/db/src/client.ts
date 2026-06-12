// packages/db/src/client.ts
// Singleton Prisma client with connection pooling, query logging, and
// soft-shutdown support. Import this; never instantiate PrismaClient directly.
import { PrismaClient } from '@prisma/client';

const LOG_LEVELS =
  process.env.NODE_ENV === 'production'
    ? (['warn', 'error'] as const)
    : (['query', 'warn', 'error'] as const);

function createClient(): PrismaClient {
  const client = new PrismaClient({
    log: LOG_LEVELS.map((level) => ({ emit: 'event', level })),
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    (client as any).$on('query', (e: { query: string; duration: number }) => {
      if (e.duration > 500) {
        console.warn(`[prisma] slow query (${e.duration}ms): ${e.query.slice(0, 120)}`);
      }
    });
  }

  return client;
}

// ── Global singleton ──────────────────────────────────────────────────────────
// In Next.js dev hot-reload, module cache is cleared between HMR cycles.
// The `global` trick ensures we never create more than one PrismaClient.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

let isShuttingDown = false;

export async function disconnectDb(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  await prisma.$disconnect();
}

process.on('beforeExit', disconnectDb);
