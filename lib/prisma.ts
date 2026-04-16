// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Use globalThis so the reference survives across module hot-reloads in dev
// AND across module re-evaluations in serverless cold starts in production.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always store on global — not just in development.
// Root cause of connection pool exhaustion: without this line in production,
// every serverless invocation that evaluates this module creates a fresh
// PrismaClient (and a new connection pool), quickly exhausting the DB limit.
globalForPrisma.prisma = prisma;

// Graceful shutdown for long-running containers (Railway, Render, Docker).
// No-op in serverless (Vercel) since the process is killed externally.
if (process.env.NODE_ENV === 'production') {
  const disconnect = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once('SIGINT',  disconnect);
  process.once('SIGTERM', disconnect);
}

export type { PrismaClient };