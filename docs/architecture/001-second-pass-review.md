# M1.0 Spike Review, ADR Finalization, and M1.1a

Most of the spike evidence holds up and supports ADR-005 and ADR-006. Four things in the report don't hold up as written, though:

- **One S1 result is a real problem, and the report didn't flag it.** Pickup latency came back at p50 49 s and p95 90 s.
- **The pinned versions include some with known critical vulnerabilities.** They can't become the project baseline.
- **S3 check 4 wasn't actually tested.** It passed on a different question than the one it was meant to answer.
- **The spike-to-M1.1 path needs to change,** because TypeScript 7 doesn't yet work with typed ESLint.

None of these blocks M1.1. I've split M1.1 into two reviewable parts and included M1.1a at the end.

---

## 1. Review of the spike results

### What the evidence supports

| Claim                                                                                                                          | Evidence                                                     | Verdict                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| A job enqueued inside a transaction commits and rolls back with it                                                             | `rollbackDiscards: true, commitPersists: true`               | **Confirmed.** This is the core of ADR-005.                                                   |
| Crash recovery is bounded by the monitor, not by job expiration                                                                | ~60.2 s at a 30 s heartbeat and at a 10 s heartbeat          | **Confirmed**, with one refinement in §2                                                      |
| Dead-letter queue (DLQ) retry count and source tracking                                                                        | 3 attempts, `sourceId` matches                               | **Confirmed**                                                                                 |
| RLS fails closed, rejects writes through WITH CHECK, holds up with composite FKs, and doesn't leak through the connection pool | 6/6 tests pass, and the SQLSTATE codes are the expected ones | **Confirmed.** This was the check that had to pass.                                           |
| drizzle-kit leaves custom RLS SQL alone                                                                                        | "No schema changes"                                          | **Confirmed**                                                                                 |
| `withTenant` overhead and template cloning                                                                                     | +0.88 ms p50 / +1.89 ms p95; clone p50 175 ms                | **Within thresholds**, though p95 is close to the 2 ms limit. See the environment note below. |
| ESM OpenTelemetry correlates traces across HTTP, the database, and pino                                                        | Same `traceId` everywhere                                    | **Confirmed on old OTel versions.** Re-check on current versions in M1.2.                     |
| SSE passes through Caddy without buffering                                                                                     | ~255 ms spacing with `flush_interval -1`                     | **Confirmed**                                                                                 |

### What the evidence does not support

**F1. Pickup latency (high severity, my mistake in the test design).** `pickup_ms` p50 49,006 ms and p95 90,401 ms can't be waved through. The numbers fit a worker that takes **one job per polling interval**. pg-boss's docs say the `work()` default is "1 job every 2 seconds." My script sent 50 jobs at 10 per second into a worker that drains 0.5 per second, so the numbers reflect backlog building up at the throughput limit, not pickup latency. Two conclusions:

- The test mixed up latency and throughput. That's my error, and I should have written a decision rule for it.
- The production impact is real. With the default configuration, one worker processes about 30 jobs per minute per queue. Ingesting a single large document (extract, chunk, and batched embed stages) would visibly queue up behind that.

Every queue needs an explicit throughput configuration, measured by the follow-up spike S1b (§3). S1b blocks M1.5, not M1.1.

**F2. The version table can't become the project baseline (critical severity for the baseline, low actual exposure).** Several pinned versions are old enough to have known vulnerabilities:

- **React 19.0.0** is in the affected range of CVE-2025-55182 ("React2Shell"), a CVSS 10.0 remote code execution flaw in React Server Components. The affected versions are 19.0, 19.1.0, 19.1.1, and 19.2.0.
- **Next.js 15.2.1** comes before the fix for CVE-2025-29927, a middleware authorization bypass. It's also affected by the Next.js advisory that goes with React2Shell (CVE-2025-66478).
- **Fastify 5.2.0, pino 9.6.0, and OTel `sdk-node` 0.57 / `sdk-trace-base` 1.30** date from early 2025, while the rest of the stack (pnpm 12, Vitest 5, TypeScript 7) is from mid-2026. That mismatch suggests these versions were written into `package.json` by hand rather than resolved at install time. Please check them against `pnpm-lock.yaml`.

The spike ran locally and is never merged, so the practical risk is small. Stop the spike's `next dev` server all the same, since it may listen on your LAN interface. The rule from here on is in ADR-022 (§2): **no version is typed from memory, whether by you, me, or an IDE assistant.** Packages are installed at current releases, and the lockfile is the pin.

**F3. S3 check 4 passed on the wrong question.** The pass criterion was "route-level spans appear." The report confirmed HTTP and pg spans from auto-instrumentation. Those come from the Node HTTP instrumentation, not from Fastify route instrumentation. The Fastify team now maintains `@fastify/otel`, which replaces the contrib instrumentation. **Result: inconclusive.** It gets resolved in M1.2 and doesn't block anything.

**F4. `pnpm approve-builds --all` defeats a supply-chain control.** pnpm 11+ blocks dependency build scripts by default and uses `allowBuilds` in place of the older settings. Approving everything re-enables install scripts for every transitive package. That was fine inside a spike, but the real repo will use an explicit allowlist. The native builds that `@testcontainers/postgresql` pulled in (`ssh2`, `cpu-features`) are probably optional and can likely be denied. M1.1a verifies this.

**F5. The RLS query plan shows a planner misestimate that matters later.** The plan estimated 186 rows and found 1,000. It chose a Bitmap Heap Scan followed by a top-N sort, instead of an ordered index scan on `(workspace_id, created_at DESC)` that would stop after 50 rows. The cause is that `current_setting(...)` is opaque to the planner. At 1,000 rows per workspace this costs 2 ms. At 100k tasks in a workspace, the sort would dominate. The fix is already in the architecture: repositories **also** filter `workspace_id = $1` explicitly (the application-scoping layer), which gives the planner a real parameter. The evidence changes how we describe that layer (ADR-008, §2). M1.4 re-runs this plan with the explicit predicate and expects an Index Scan with no Sort node.

**F6. `bootstrap.sql` was edited before S2, and I haven't seen the diff.** That file becomes the template for production role provisioning, so please paste the change. The pgboss fix also needs one clarification. `ALTER DEFAULT PRIVILEGES ... ON SCHEMAS` only affects schemas created _afterwards_. The spike worked because of the explicit `GRANT USAGE ON SCHEMA pgboss`. The production release step will issue explicit grants after pg-boss installs its schema, and a startup check will verify them (§2).

**F7. Environment caveats.** The measurements ran on Windows with Docker Desktop, and the repo lives under **OneDrive**. The relative numbers (overhead, pass or fail) are valid. The absolute latencies are inflated by Docker Desktop networking. A 2.3 ms baseline for `BEGIN; SELECT 1; COMMIT` is high. The OneDrive location causes practical problems:

- Sync can lock files during `pnpm install`.
- It uploads `node_modules` and `.turbo` to the cloud.
- A future `.env` file would be synced to cloud storage.
- The space in the path (`Projects - Part2`) breaks some tools.

**Please move the repo to a local path without spaces (e.g., `C:\dev\aureon`) before M1.1a.** Working inside WSL2 would also give you parity with Linux CI. That's recommended but not required.

---

## 2. Architecture updates the evidence requires

These are the only changes, and each one traces back to a finding.

| ADR                                              | New status                   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Evidence            |
| ------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **005** pg-boss                                  | **Accepted with conditions** | (a) The crash-recovery target is ≤ 2 minutes. The default heartbeat is **30 s**, because 10 s didn't improve recovery (the monitor interval dominates) and only adds writes. Lowering the monitor interval is a later tuning knob. (b) **Every queue declares its polling interval, batch size, and concurrency in validated configuration.** The library defaults are never used implicitly. Values come from S1b. (c) Queue creation stays in the release step. The runtime role _can_ create queues (`allowed: true`), so the worker gets a startup check: all expected queues exist with the expected policy, or the worker fails fast. (d) The release step issues explicit `GRANT USAGE ON SCHEMA pgboss` and table grants after install. Default privileges are only a backup. | S1 results, F1, F6  |
| **006** Drizzle + custom SQL migrations          | **Accepted**                 | No change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | S2 drift test       |
| **008** Tenancy                                  | **Accepted, amended**        | Application scoping is a **required** layer, not only defense in depth. It supplies the planner with a real parameter (F5). The `withTenant` helper design is accepted as tested.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | S2 plan, F5         |
| **013** OpenTelemetry                            | **Accepted, one item open**  | ESM correlation is confirmed. Current OTel versions and `@fastify/otel` route spans get verified in M1.2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | S3, F3              |
| **022 (new)** Dependency and supply-chain policy | **Accepted**                 | Versions are resolved at install, never typed from memory, and the lockfile is the pin. `allowBuilds` is an explicit allowlist. A `pnpm audit --audit-level=high` gate and automated update PRs come in M1.1b. Release-age cooldown uses pnpm's `minimumReleaseAge`. TypeScript is **6.x**, because typescript-eslint's typed linting doesn't yet run on TS 7. The tracking issue describes tsgo as consumed via native bindings and not yet stable. We revisit TS 7 when typescript-eslint supports it.                                                                                                                                                                                                                                                                              | F2, F4, TS 7 status |

ADR-005 needs your confirmation on nothing further. The conditions are engineering calls I'm making.

---

## 3. Follow-up spike S1b: worker throughput (blocks M1.5 only)

This spike measures latency and throughput separately. It uses a separate queue and runs in the existing spike folder.

```ts
// spikes/s1-queue/src/d-throughput.ts
// Measures (1) idle pickup latency: one job in flight at a time
//          (2) drain throughput: N queued no-op jobs under a given work() configuration
import { performance } from 'node:perf_hooks';
import { installAsOwner, percentile, report, runtimeBoss } from './common.js';

const QUEUE = 's1_tp';
const pollSeconds = Number(process.env.POLL_SECONDS ?? 2);
const batchSize = Number(process.env.BATCH_SIZE ?? 1);
const localConcurrency = Number(process.env.LOCAL_CONCURRENCY ?? 1);

await installAsOwner([{ name: QUEUE }]);
const boss = runtimeBoss();
await boss.start();
await boss.deleteQueuedJobs(QUEUE);

// Phase 1: idle pickup latency. The next job is sent only after the previous one completes.
const idleMs: number[] = [];
let resolveNext: (() => void) | undefined;
const workerId = await boss.work<{ sentAt: number }>(
  QUEUE,
  { pollingIntervalSeconds: pollSeconds, batchSize, localConcurrency },
  async (jobs) => {
    for (const job of jobs) idleMs.push(Date.now() - job.data.sentAt);
    resolveNext?.();
  },
);
for (let i = 0; i < 20; i++) {
  const done = new Promise<void>((r) => {
    resolveNext = r;
  });
  await boss.send(QUEUE, { sentAt: Date.now() });
  await done;
}
report('s1b.idle_pickup_ms', { pollSeconds, p50: percentile(idleMs, 50), p95: percentile(idleMs, 95) });
await boss.offWork(QUEUE, { id: workerId });

// Phase 2: drain throughput. Enqueue first, then start the worker.
const N = 500;
await boss.insert(
  QUEUE,
  Array.from({ length: N }, () => ({ data: { sentAt: 0 } })),
);
let processed = 0;
const t0 = performance.now();
await new Promise<void>((resolve) => {
  void boss.work(
    QUEUE,
    { pollingIntervalSeconds: pollSeconds, batchSize, localConcurrency },
    async (jobs) => {
      processed += jobs.length;
      if (processed >= N) resolve();
    },
  );
});
const seconds = (performance.now() - t0) / 1000;
report('s1b.drain', {
  pollSeconds,
  batchSize,
  localConcurrency,
  jobs: N,
  seconds,
  jobsPerSecond: N / seconds,
});
await boss.stop();
```

**Run it** four times: `(BATCH_SIZE=1, LOCAL_CONCURRENCY=1)`, `(1, 4)`, `(10, 1)`, and `(10, 4)`, each with `POLL_SECONDS=2`. Paste the `RESULT` lines and any type errors. If `localConcurrency` or `insert()` has a different name or signature in pg-boss 12.x, that's itself a finding. Report it rather than working around it.

**Decision rules (written before the results):**

| If…                                         | Then…                                                                                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idle pickup p95 ≤ polling interval + 500 ms | Polling stays the default. Background jobs accept ~1–2 s start latency.                                                                                                                |
| Some configuration drains ≥ 20 no-op jobs/s | That becomes the baseline for bulk queues (embedding, purge). Low-volume queues (daily plan, notifications) stay at concurrency 1.                                                     |
| No configuration reaches 20 jobs/s          | Re-open ADR-005 and look at pg-boss throughput tuning. Real jobs are dominated by AI and IO time, so this is unlikely to change the decision, but it has to be understood before M1.5. |

---

## 4. M1.1 split

M1.1 as planned bundles two things that are easier to review separately:

| Part                      | Scope                                                                                                                                                                                             | Why separate                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **M1.1a** (this response) | Workspace, TypeScript, formatting, test runner, first CI pipeline, the `Clock` port, and the docs skeleton                                                                                        | The foundations have to be green before rules are layered on top         |
| **M1.1b** (next)          | ADR-021 enforcement: dependency-cruiser rules, ESLint restrictions, violation fixtures that prove each rule fires, manifest policy script, test-pairing script, gitleaks, audit gate, `AGENTS.md` | Each rule needs a failing fixture, and that work deserves its own review |

**One deliberate change from the original M1.1 plan: no empty packages.** The plan called for "empty-but-real" `apps/{web,api,worker}` and all packages. An empty package adds build configuration without adding capability, and it tempts "one test per package" placeholder tests, which your rules forbid in spirit. Instead, **packages are created with their first real content** (`api` in M1.3, `db` in M1.4, `worker` in M1.5, and so on). In M1.1b, the boundary rules are written against path globs and proven with fixtures, so they apply as soon as code shows up. The only package in M1.1a is `packages/platform`, because it has a real capability: the `Clock` port that ADR-021 requires.

---

## 5. M1.1a: Workspace foundation

### Where this lives and why

The repo root holds workspace configuration shared by every package. `packages/platform/src/kernel/` holds the smallest shared primitives. Its first resident is `Clock`, because the rule "no `new Date()` in domain or application code" (M1.1b) needs a sanctioned alternative before it can be enforced.

### Step 0: Setup (run these; don't hand-write versions)

```powershell
# From a local, non-synced path, e.g. C:\dev\aureon, on branch main
pnpm init
pnpm add -D -w typescript@^6 vitest prettier turbo @types/node
pnpm approve-builds   # interactive: approve only what's needed (likely esbuild, if listed). Deny the rest.
```

Run `pnpm add -D --filter @aureon/platform vitest typescript@^6` after creating the package in Step 3. Record the resolved versions from the lockfile in `docs/development/toolchain.md`. That file is the only place where versions are written down, and they're copied from the lockfile.

### Step 1: Root configuration

```jsonc
// package.json (merge into the generated file; keep the versions pnpm resolved)
{
  "name": "aureon",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@12.6.0",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "check": "pnpm format:check && turbo run typecheck test",
  },
}
```

The `engines` range pins Node 24 LTS on purpose. A Node major upgrade becomes a reviewed change instead of something that drifts in. `lint` joins `check` in M1.1b.

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
# Supply-chain cooldown: don't install releases younger than 1 day (value in minutes).
# Verify the setting is recognized with `pnpm config get minimumReleaseAge`.
minimumReleaseAge: 1440
# allowBuilds: written by `pnpm approve-builds`. Commit it and review changes to it like code.
```

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "useUnknownInCatchVariables": true,

    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noEmit": true,
  },
}
```

Two choices here are worth explaining.

- **`NodeNext` with explicit `.js` import extensions.** This is exactly what Node's ESM loader resolves at runtime, so type-checking matches runtime behavior. The web app gets its own bundler-resolution tsconfig in M2.8. M1.3 verifies that Next.js resolves `.js` specifiers inside source-consumed `contracts`. If it doesn't, the fallback is TypeScript's `rewriteRelativeImportExtensions`.
- **`noEmit` in the base config.** Packages are consumed as TypeScript source. Only apps build, starting in M1.3.

```jsonc
// turbo.json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "typecheck": { "inputs": ["src/**", "tsconfig.json", "../../tsconfig.base.json"] },
    "test": { "inputs": ["src/**", "vitest.config.*"], "outputs": ["coverage/**"] },
  },
}
```

```jsonc
// .prettierrc.json
{ "singleQuote": true, "trailingComma": "all", "printWidth": 110, "endOfLine": "lf" }
```

```text
# .prettierignore
pnpm-lock.yaml
**/coverage/**
**/.turbo/**
**/dist/**
**/.next/**
```

```text
# .gitattributes: Windows checkouts keep LF, so formatting and hashes stay stable across OSes
* text=auto eol=lf
*.png binary
*.pdf binary
```

```text
# .gitignore
node_modules/
dist/
.next/
.turbo/
coverage/
*.log
.env
.env.*
!.env.example
```

```text
# .editorconfig
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

```text
# .nvmrc
24
```

### Step 2: CI pipeline (first version)

```yaml
# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read # least privilege; jobs that need more request it explicitly

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4 # reads the version from packageManager
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm test
```

In M1.1b, the action versions get pinned to commit SHAs and kept current through automated update PRs, per ADR-022. Tags are mutable and SHAs aren't. The lint, boundary, secret-scan, and audit steps are added there too.

### Step 3: `packages/platform`, the `Clock` port

**Design.** Domain and application code that needs "now" takes a `Clock` as a dependency. Production wires in `systemClock`. Tests use `ManualClock`. This matters for Aureon in particular: daily planning, session expiry, reset-token expiry, budget periods, and memory `last_verified_at` all depend on time. Tests need to control time without real sleeps or global fake timers.

`Clock` returns a fresh `Date` on every call, so a caller mutating the result can't affect the clock. I chose `Date` over a branded epoch number because `pg` and Drizzle exchange `Date` for `timestamptz`, and converting at every boundary would be busywork. `ManualClock` lives here for now. It moves to `packages/testing` when that package is created in M1.4.

```jsonc
// packages/platform/package.json
{
  "name": "@aureon/platform",
  "private": true,
  "type": "module",
  "exports": { "./kernel": "./src/kernel/index.ts" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "vitest run",
  },
}
```

```jsonc
// packages/platform/tsconfig.json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

```ts
// packages/platform/src/kernel/clock.ts

/**
 * Source of the current time.
 * Domain and application code depend on this port instead of the global Date,
 * so time-dependent behavior is deterministic in tests.
 */
export interface Clock {
  /** Returns a new Date on every call; callers may not observe each other's mutations. */
  now(): Date;
}

/** The only sanctioned reader of the system clock. Wired in composition roots. */
export const systemClock: Clock = Object.freeze({
  now: (): Date => new Date(),
});

/** Test clock that only moves when told to. Moves to @aureon/testing in M1.4. */
export class ManualClock implements Clock {
  #epochMs: number;

  constructor(start: Date) {
    const epochMs = start.getTime();
    if (Number.isNaN(epochMs)) {
      throw new RangeError('ManualClock requires a valid start date');
    }
    this.#epochMs = epochMs;
  }

  now(): Date {
    return new Date(this.#epochMs);
  }

  /** Moves time forward. Moving backwards is rejected: expiry logic assumes monotonic time. */
  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new RangeError('ManualClock can only advance by a finite, non-negative duration');
    }
    this.#epochMs += milliseconds;
  }
}
```

```ts
// packages/platform/src/kernel/index.ts
export { type Clock, ManualClock, systemClock } from './clock.js';
```

```ts
// packages/platform/src/kernel/clock.test.ts
import { describe, expect, it } from 'vitest';
import { ManualClock, systemClock } from './clock.js';

describe('systemClock', () => {
  it('reports the current system time', () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    const after = Date.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });
});

describe('ManualClock', () => {
  const start = new Date('2026-09-26T09:00:00.000Z');

  it('returns the start time until advanced', () => {
    const clock = new ManualClock(start);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });

  it('advances by the given duration', () => {
    const clock = new ManualClock(start);
    clock.advanceBy(90_000);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:01:30.000Z');
  });

  it('is not affected by callers mutating returned dates', () => {
    const clock = new ManualClock(start);
    clock.now().setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });

  it('is not affected by callers mutating the start date', () => {
    const mutableStart = new Date(start);
    const clock = new ManualClock(mutableStart);
    mutableStart.setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });

  it('rejects an invalid start date', () => {
    expect(() => new ManualClock(new Date('not a date'))).toThrow(RangeError);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects advancing by %s', (ms) => {
    const clock = new ManualClock(start);
    expect(() => clock.advanceBy(ms)).toThrow(RangeError);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });
});
```

### Step 4: Docs skeleton (commit the documents that describe reality)

```text
docs/
  architecture/000-kickoff.md               ← kickoff document, verbatim
  architecture/001-second-pass-review.md    ← review document, verbatim
  decisions/ADR-001 … ADR-022 (one file each; Context / Decision / Alternatives / Consequences / Status)
  spikes/m1.0-results.md                    ← your results report + §1 of this response (the analysis)
  development/getting-started.md            ← prerequisites, install, `pnpm check`. Nothing that doesn't exist yet.
  development/toolchain.md                  ← versions copied from the lockfile
README.md                                   ← one paragraph: what Aureon is, current state ("foundation only"), link to docs
```

The spike _code_ stays on `spikes/m1.0` and is never merged. The spike _results_ go on `main`, because the ADRs cite them.

### Step 5: How to verify

| #   | Command or action                                                     | Expected                                                                         |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `pnpm install --frozen-lockfile` on a fresh clone                     | Succeeds with no build-script prompts beyond the allowlist                       |
| 2   | `pnpm check`                                                          | Formatting passes, typecheck passes, 9 tests pass (1 + 5 + 3 parametrized cases) |
| 3   | Add `const x: number = 'a';` to `clock.ts`, then run `pnpm typecheck` | **Fails.** Revert afterwards.                                                    |
| 4   | Break formatting in a file, then run `pnpm format:check`              | **Fails** and names the file                                                     |
| 5   | Run `pnpm check` twice in a row                                       | The second run shows Turbo cache hits (`FULL TURBO` or cached tasks)             |
| 6   | Push a branch and open a PR                                           | The CI `check` job goes green in under 5 minutes. Report the actual duration.    |
| 7   | `git ls-files --eol` on Windows                                       | Tracked text files show `i/lf`                                                   |

**Likely failure modes:**

- pnpm refusing to install because of `minimumReleaseAge`. If a just-released version is needed, lower the value for that change and record why.
- TypeScript 6 complaining about a `@types/node` version that expects newer TypeScript. Align them. Don't loosen `strict`.
- Vitest 5 requiring a config file for ESM TypeScript packages. If so, add a minimal `vitest.config.ts` and report it.
- `pnpm/action-setup` failing because CI's pnpm version differs from `packageManager`. The field is the source of truth.

### Step 6: Self-review of M1.1a

| Area                    | Assessment                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture            | No package exists without real content. `platform/kernel` has no dependencies.                                                                                                 |
| Correctness             | `ManualClock` defensively copies its input and output and rejects non-monotonic moves. That's tested, including the mutable-input case, which is easy to miss.                 |
| Security                | Least-privilege CI token. The lockfile is enforced. The build-script allowlist is explicit. SHA pinning is deferred to M1.1b, and I'm stating that here rather than hiding it. |
| Testing                 | The capability is tested at its edges. The `systemClock` test uses bounds, not exact values, so it can't be flaky.                                                             |
| Gaps (by design, M1.1b) | No lint, no boundary enforcement, no secret scanning, no audit gate. Until M1.1b lands, those rules are enforced only by review.                                               |

---

## What I need back

1. **The M1.1a verification table**, rows 1–7, with actual output: the CI duration, the resolved versions, and any failure exactly as it appeared.
2. **The `bootstrap.sql` diff** from before S2 (F6).
3. **Confirmation that the repo moved out of OneDrive** (F7).
4. **S1b results** whenever convenient. They're needed before M1.5, not before M1.1b.

Nothing in this response needs an architectural decision from you. Once the M1.1a verification is green, I'll do M1.1b: architecture enforcement, with a failing fixture proving each rule.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-26T17:38:19+05:30.

The user's current state is as follows:
Active Document: c:\Users\Aryan\OneDrive\Desktop\MyWork\Projects - Part2\aureon\spikes\s3-runtime\api\src\instrumentation.ts (LANGUAGE_TYPESCRIPT)
Cursor is on line: 1
Other open documents:

- c:\Users\Aryan\OneDrive\Desktop\MyWork\Projects - Part2\aureon\spikes\s3-runtime\contracts\package.json (LANGUAGE_JSON)
- c:\Users\Aryan\OneDrive\Desktop\MyWork\Projects - Part2\aureon\spikes\s3-runtime\contracts\src\index.ts (LANGUAGE_TYPESCRIPT)
- c:\Users\Aryan\OneDrive\Desktop\MyWork\Projects - Part2\aureon\spikes\s3-runtime\api\package.json (LANGUAGE_JSON)
- c:\Users\Aryan\OneDrive\Desktop\MyWork\Projects - Part2\aureon\spikes\s3-runtime\api\src\sse-route.ts (LANGUAGE_TYPESCRIPT)
- c:\Users\Aryan\OneDrive\Desktop\MyWork\Projects - Part2\aureon\spikes\s3-runtime\api\src\instrumentation.ts (LANGUAGE_TYPESCRIPT)
  </ADDITIONAL_METADATA>
