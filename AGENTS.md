# AGENTS.md: rules for anyone (human or AI assistant) changing this repository

## Authority

Architecture lives in docs/decisions (ADRs) and docs/architecture. Assistants implement approved
milestones. They do not make, rewrite, or paraphrase architectural decisions.

## Layout and dependency direction

- packages/core/src/modules/<module>/{domain,application,infrastructure}/ + index.ts (the only public surface)
- domain -> own domain + platform/kernel only; application -> domain + ports; infrastructure -> application + platform/db
- packages/ai: the only place provider SDKs are imported; exposes only src/index.ts; never imports core
- packages/contracts: standalone; apps/web imports only @aureon/contracts
- modules/context (Context Engine): no database access of any kind; gathers via other modules' public query services

## Machine-enforced (ADR-021; proof in tools/arch-fixtures)

DB libraries outside infrastructure/platform-db; AI SDKs outside packages/ai; `new Date()`, `Date.now()`,
`Math.random()`, `randomUUID()`, `node:crypto` in domain/application (use Clock / IdGenerator);
`process.env` outside platform/src/config; `sql.raw`; computed `import()`; `any`; floating promises;
non-exhaustive switches; cross-module deep imports; layer violations; cycles.

## Review checklist (not machine-enforced)

- Tool input schemas never contain workspace_id or user_id (machine-enforced from M5.4)
- Every application capability has meaningful tests, including failure paths
- Aliased imports (`import { sql as s }`) and indirect references (`globalThis.Date.now`) evade lint: reject them in review
- Job handlers are idempotent under at-least-once delivery; job payloads carry IDs only
- No prompts, document text, tokens, or passwords in logs

## Process rules

- Never type dependency versions by hand. Use `pnpm add`; the lockfile is the pin (ADR-022).
- Never run `pnpm approve-builds --all`. Approve builds individually and state why.
- Never weaken a rule, add eslint-disable, or edit fixtures to make CI pass. If a rule seems wrong, stop and raise it.
- Adding a rule requires a violation fixture and a compliant fixture.
- Never author or paraphrase ADRs or architecture docs. Copy approved text; every ADR ends with a Source: line.
- Report every deviation from instructions (changed parameters, skipped steps, edited harnesses) next to the results.
- Never report a verification step as done unless it ran; include the actual output.
- Spike code never merges into main.
