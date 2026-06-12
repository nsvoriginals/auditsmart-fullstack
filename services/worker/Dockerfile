# services/worker/Dockerfile
# Multi-stage build — keeps the final image lean

FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

# ── deps stage: install all workspace deps ──────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json    ./packages/shared/
COPY packages/embeddings/package.json ./packages/embeddings/
COPY services/worker/package.json    ./services/worker/

RUN pnpm install --frozen-lockfile --prod=false

# ── build stage: compile TypeScript ──────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY services/worker/ ./services/worker/
COPY prisma/ ./prisma/

RUN pnpm --filter @auditsmart/worker build

# ── runner stage: minimal runtime image ──────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app

# Semgrep: Python-based CLI called as a child process from the worker
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir semgrep --break-system-packages

# Security: run as non-root
RUN addgroup -S auditsmart && adduser -S worker -G auditsmart

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages     ./packages
COPY --from=builder /app/services/worker/dist ./services/worker/dist
COPY --from=builder /app/services/worker/package.json ./services/worker/package.json
COPY --from=builder /app/prisma       ./prisma

# Prisma client
RUN pnpm --filter @auditsmart/worker exec prisma generate

USER worker

CMD ["node", "services/worker/dist/index.js"]
