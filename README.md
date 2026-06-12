# AuditSmart

A deterministic-first smart contract security platform. Static analyzers produce the findings; LLMs only explain them. Audits run asynchronously on a durable queue so long-running analysis never blocks (or gets killed by) an HTTP request.

## How it works

```
Next.js API ──enqueue──► Redis (BullMQ) ──consume──► Worker
   │                                                   │
   │ poll status                          ┌────────────┼─────────────┐
   ▼                                       ▼            ▼             ▼
 Postgres ◄──────────────────────────  Slither     Semgrep      AST parser
                                       (sidecar)   (in-proc)    (in-proc)
                                            │
                                            └─► normalize → correlate → confidence
                                                → AI explanation pass (Claude/Groq)
```

- **API only enqueues.** `POST /api/audit/scan` validates, creates the audit row, and pushes a job. It returns `202` immediately with a `job_id` to poll.
- **Worker does the analysis.** Slither (real static analysis via a Python sidecar), Semgrep, and an AST pass run in parallel. Findings are normalized to a canonical shape, deduplicated by location, and scored by **evidence** (which tools confirmed them) — not by LLM opinion.
- **AI is the explanation layer**, not the source of truth. It adds narrative, exploit scenarios, and fix suggestions on top of deterministic findings.
- **Findings are classified** with SWC and CWE IDs and exported to SARIF 2.1.0.

## Tech stack

- **Web/API:** Next.js 14 (App Router), TypeScript, NextAuth, Tailwind
- **Queue/Worker:** BullMQ on Redis, Node worker service
- **Analyzers:** Slither (FastAPI sidecar), Semgrep, `@solidity-parser` AST
- **AI:** Anthropic Claude, Groq (Llama), Google Gemini
- **Data:** PostgreSQL + pgvector (exploit knowledge base), Prisma
- **Payments:** Razorpay
- **Infra:** pnpm workspaces + Turborepo, Docker Compose, AWS (EC2/ECS)

## Repository layout

```
app/                 Next.js routes + API (enqueue, status, payments, auth)
lib/                 API helpers, queue producer, plans, config
packages/
  shared/            Queue names, canonical types, SWC/CWE maps
  db/                Prisma client + repositories
  embeddings/        Embedding providers (OpenAI + local fallback)
services/
  worker/            BullMQ consumers + analyzer integrations
  slither/           Slither static-analysis sidecar (FastAPI)
prisma/              Schema + migrations
docker/ infra/       nginx, Postgres init, K8s manifests
docs/                ADRs + runbooks
```

## Local development

Requires **Node 20+**, **pnpm 9**, and **Docker**.

```bash
pnpm install

# 1. Start infrastructure (Postgres + Redis + Slither sidecar)
docker compose up -d postgres redis slither

# 2. Apply the schema
pnpm prisma migrate dev

# 3. Run the API and the worker (separate terminals)
pnpm dev                                  # Next.js on :3000
pnpm --filter @auditsmart/worker dev      # queue consumer
```

Copy your environment variables into a root `.env` (see the env reference below). For local dev with apps on the host, point `DATABASE_URL`/`REDIS_URL` at `localhost`.

## Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | API + worker | Postgres connection |
| `REDIS_URL` | API + worker | **TCP** Redis for BullMQ (`redis://` / `rediss://`) — not the Upstash REST URL |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | API | Auth |
| `NEXT_PUBLIC_APP_URL` | API | Public base URL (build-time) |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | API | OAuth login |
| `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` | API + worker | AI providers |
| `OPENAI_API_KEY` | worker | Embeddings (optional; local fallback) |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | API | Payments |
| `UPSTASH_REDIS_REST_URL/TOKEN` | API | Rate limiting (optional) |
| `RESEND_API_KEY`, `NEWSLETTER_API_KEY` | API | Email (optional) |

The Slither sidecar needs no secrets. Postgres/Redis container passwords (`POSTGRES_*`, `REDIS_PASSWORD`) are read by Docker Compose.

## Deployment

Single-box: Docker Compose on an AWS EC2 instance (Postgres + Redis + API + worker + Slither + nginx). Scale-out: containers on ECS Fargate behind an ALB, with RDS + ElastiCache, autoscaling the worker on queue depth. See `docs/` for ADRs and runbooks.

## License

[MIT](LICENSE)
