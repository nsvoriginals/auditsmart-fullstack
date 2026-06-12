# ADR-002: Fastify for API Gateway (not NestJS)

**Status:** Accepted  
**Date:** 2026-05-25

## Context

The Next.js API route handlers are co-located with the web app, making it hard
to version, independently scale, or expose a developer API. A dedicated API
gateway is required.

## Options considered

| Option | Throughput | Overhead | DI/IoC | Auditability |
|--------|-----------|---------|--------|-------------|
| NestJS | Medium | High (IoC, decorators) | Built-in | Poor (decorator magic) |
| Fastify | High (~35k req/s) | Low | Manual / fastify-di | Excellent (explicit) |
| Express | Low | Low | None | Good |
| Hono | Very high | Minimal | None | Excellent |

## Decision

**Fastify** for the following reasons:

1. **Throughput**: Fastify benchmarks at ~35k req/s vs ~18k for NestJS.
   At scale (hundreds of CI audits/minute), this matters.

2. **Explicit is better for a security product**: NestJS decorators hide what
   is actually happening. A security audit platform should have zero hidden
   framework magic — every request lifecycle step must be traceable.

3. **Schema validation built-in**: Fastify uses Ajv + JSON Schema for route
   schema validation, producing typed request/response objects without code
   generation. Combined with Zod for business logic validation, this provides
   end-to-end type safety.

4. **Plugin model matches our service model**: Fastify's plugin system enforces
   encapsulation boundaries that match our DDD-inspired service structure.

## NestJS rejected because

- Decorator metadata breaks source maps in production
- IoC container is a black box that's hard to reason about under load
- Harder to test (TestingModule setup is verbose)
- Ironic to use a framework you can't audit in a security audit platform

## API architecture

- **External (REST + OpenAPI)**: audit submission, results, webhooks, SARIF upload
- **Internal (tRPC)**: `apps/web` → `apps/web/api` routes (end-to-end type safety)
- **Machine-to-machine**: API keys + HMAC-signed webhook delivery
