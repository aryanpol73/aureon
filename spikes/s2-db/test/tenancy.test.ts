import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from '../src/schema.js';
import { type Db, withTenant } from '../src/tenant.js';

const DB = 'aureon_spike';
let container: StartedPostgreSqlContainer;
const pools: pg.Pool[] = [];
const cloneMs: number[] = [];
const wsA = randomUUID(), wsB = randomUUID(), projectA = randomUUID(), projectB = randomUUID();
const ctxA = { workspaceId: wsA, userId: randomUUID() };

const url = (user: string, pw: string, database = DB) =>
  `postgres://${user}:${pw}@${container.getHost()}:${container.getPort()}/${database}`;
const makePool = (user: string, pw: string, max = 4) => {
  const p = new pg.Pool({ connectionString: url(user, pw), max }); pools.push(p); return p;
};
/** Drizzle may wrap driver errors, so look for the SQLSTATE on the error or its cause. */
const pgCode = (e: unknown): string | undefined => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err.code ?? err.cause?.code;
};
const p = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.floor((q / 100) * (xs.length - 1))];

let appPool: pg.Pool, appDb: Db, systemPool: pg.Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer('pgvector/pgvector:pg17')
    .withDatabase(DB).withUsername('postgres').withPassword('postgres').start();

  const admin = new pg.Client({ connectionString: url('postgres', 'postgres') });
  await admin.connect();
  await admin.query(await readFile(new URL('../../bootstrap.sql', import.meta.url), 'utf8'));
  await admin.end();

  const owner = new pg.Client({ connectionString: url('aureon_owner', 'owner_spike') });
  await owner.connect();
  await migrate(drizzle({ client: owner }), { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  await owner.end();

  // Template cloning for per-test-file isolation (requires no open connections to DB).
  const maint = new pg.Client({ connectionString: url('postgres', 'postgres', 'postgres') });
  await maint.connect();
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await maint.query(`create database clone_${i} template ${DB}`);
    cloneMs.push(performance.now() - t0);
  }
  await maint.end();

  systemPool = makePool('aureon_system', 'system_spike');
  await systemPool.query(`insert into workspaces (id, name) values ($1,'A'),($2,'B')`, [wsA, wsB]);
  await systemPool.query(`insert into projects (id, workspace_id, name) values ($1,$2,'PA'),($3,$4,'PB')`, [projectA, wsA, projectB, wsB]);
  await systemPool.query(`insert into workspaces (id, name) select gen_random_uuid(), 'bulk-'||g from generate_series(1,50) g`);
  await systemPool.query(`insert into tasks (id, workspace_id, title)
    select gen_random_uuid(), w.id, 'task '||g from workspaces w cross join generate_series(1,1000) g`);
  await systemPool.query('analyze');

  appPool = makePool('aureon_app', 'app_spike');
  appDb = drizzle({ client: appPool, schema });
}, 180_000);

afterAll(async () => {
  await Promise.all(pools.map((x) => x.end()));
  await container?.stop();
});

describe('S2 tenancy', () => {
  it('app role is neither superuser nor BYPASSRLS', async () => {
    const { rows } = await appPool.query('select rolsuper, rolbypassrls from pg_roles where rolname = current_user');
    expect(rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it('no tenant context: zero rows, no error (fail closed)', async () => {
    const { rows } = await appPool.query('select count(*)::int as n from tasks');
    expect(rows[0].n).toBe(0);
  });

  it('tenant A sees only A', async () => {
    const rows = await withTenant(appDb, ctxA, (tx) => tx.select().from(schema.projects));
    expect(rows.map((r) => r.id)).toEqual([projectA]);
  });

  it('WITH CHECK rejects writing into B under A context', async () => {
    const err = await withTenant(appDb, ctxA, (tx) =>
      tx.insert(schema.projects).values({ id: randomUUID(), workspaceId: wsB, name: 'x' })).catch((e: unknown) => e);
    expect(pgCode(err)).toBe('42501');
  });

  it('composite FK rejects cross-workspace reference even when RLS is bypassed', async () => {
    const err = await systemPool.query(`insert into tasks (id, workspace_id, project_id, title) values ($1,$2,$3,'x')`,
      [randomUUID(), wsA, projectB]).catch((e: unknown) => e);
    expect(pgCode(err)).toBe('23503');
  });

  it('tenant context does not leak to the next use of a pooled connection', async () => {
    const single = makePool('aureon_app', 'app_spike', 1);
    const singleDb = drizzle({ client: single, schema });
    await withTenant(singleDb, ctxA, (tx) => tx.select().from(schema.projects));
    const { rows } = await single.query('select count(*)::int as n from projects');
    expect(rows[0].n).toBe(0);
  });

  it('measures: RLS query plan, withTenant overhead, clone time', async () => {
    const { rows: [bulk] } = await systemPool.query(`select id from workspaces where name = 'bulk-1'`);
    const ctx = { workspaceId: bulk.id as string, userId: randomUUID() };
    const plan = await withTenant(appDb, ctx, (tx) =>
      tx.execute(sql`explain (analyze, format json) select id, title from tasks order by created_at desc limit 50`));
    const withMs: number[] = [], withoutMs: number[] = [];
    for (let i = 0; i < 200; i++) {
      let t0 = performance.now();
      await withTenant(appDb, ctx, (tx) => tx.execute(sql`select 1`)); withMs.push(performance.now() - t0);
      t0 = performance.now();
      await appDb.transaction((tx) => tx.execute(sql`select 1`)); withoutMs.push(performance.now() - t0);
    }
    console.log('RESULT s2.plan', JSON.stringify(plan.rows[0]));
    console.log('RESULT s2.with_tenant_ms', JSON.stringify({
      p50: p(withMs, 50), p95: p(withMs, 95), baselineP50: p(withoutMs, 50), baselineP95: p(withoutMs, 95) }));
    console.log('RESULT s2.template_clone_ms', JSON.stringify({ p50: p(cloneMs, 50), max: Math.max(...cloneMs) }));
  });
});
