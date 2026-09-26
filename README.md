# Aureon

Aureon is an **AI-powered Personal Operating System and Personal Intelligence Platform** designed to unify knowledge, documents, notes, projects, tasks, goals, decisions, and long-term memory with grounded contextual reasoning.

---

## Current Status: M1.0 (Architecture Spike Kits & Validations)

All Phase 1 architectural spikes (**S1**, **S2**, **S3**) have been executed and verified on branch `spikes/m1.0`.

### Spike Summary

* **S1 — `pg-boss` Durable Queue & Transactional Semantics**
  * In-transaction enqueue: `p50 = 0.74ms`, `p95 = 1.09ms` (discarded on rollback, persisted on commit).
  * Heartbeat crash recovery verified at `~60.2s` across 10s and 30s heartbeat settings (bounded by 60s supervisor monitor interval).
  * Dead-letter queue (DLQ) verified with provenance preservation (`sourceId` matched original job ID across 3 retry attempts).
  * Runtime permissions verified: runtime role operates without DDL via default schema usage grants.

* **S2 — Drizzle ORM, PostgreSQL RLS & Test Harness**
  * Drizzle-kit migration workflow verified with zero schema drift against custom RLS SQL policies.
  * Tenancy isolation passed all 7 Vitest test cases (fail-closed behavior on null tenant, cross-tenant write prevention, composite foreign-key enforcement).
  * RLS query performance: `2.03ms` execution time over 50,000 tasks across 52 workspaces using bitmap index scan.
  * Tenant context overhead: `p50 = 0.88ms`, `p95 = 1.89ms` (under the 2ms budget).
  * PostgreSQL template cloning: `p50 = 175ms` (viable for test-suite database isolation).

* **S3 — Runtime, OpenTelemetry & Developer Experience**
  * Platform: Node.js 24 LTS (`v24.13.1`), pnpm `12.6.0`, Docker `29.6.2`, PostgreSQL 17 + `pgvector`.
  * OpenTelemetry trace propagation: unified trace correlation verified under native ESM (`HTTP span` ↔ `Pino log records` ↔ `Postgres query spans` sharing the same `traceId`).
  * Fastify hot reload: `tsx watch` reloaded in `519ms` (< 2.0s threshold).
  * Next.js monorepo integration: consumed `@aureon/contracts` as raw TypeScript source with HMR reflecting edits in `226ms`; production build succeeded.
  * Server-Sent Events (SSE): Caddy reverse proxy streaming verified in real-time with `flush_interval -1` (~250ms event intervals).

---

## Directory Structure

```text
spikes/
├── bootstrap.sql               # PostgreSQL role & privilege initialization
├── compose.yaml                # Local PostgreSQL 17 + pgvector service
├── s1-queue/                   # pg-boss queue benchmarks & crash harnesses
├── s2-db/                      # Drizzle ORM, RLS policies & Vitest test suite
└── s3-runtime/                 # Fastify API, OpenTelemetry, Caddy & Next.js web
    ├── api/                    # Fastify API server with OTel tracing
    ├── contracts/              # Shared TypeScript contracts package
    └── web/                    # Next.js frontend application
```
