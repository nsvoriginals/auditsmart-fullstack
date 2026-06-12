// services/worker/src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
  base: { service: 'auditsmart-worker' },
  redact: ['DATABASE_URL', 'REDIS_URL', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
});

export const childLogger = (module: string) => logger.child({ module });
