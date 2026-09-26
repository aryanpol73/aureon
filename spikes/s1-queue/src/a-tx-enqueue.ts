// spikes/s1-queue/src/a-tx-enqueue.ts
// Checks: send() joins our transaction; runtime role needs no DDL; enqueue and pickup latency.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import pg from 'pg';
import { APP_URL, installAsOwner, percentile, report, runtimeBoss } from './common.js';

const QUEUE = 's1_tx';
await installAsOwner([{ name: QUEUE }]);

const boss = runtimeBoss();
await boss.start(); // Observation: does this succeed without DDL rights?
report('s1.runtime_start', { ok: true });

const pool = new pg.Pool({ connectionString: APP_URL, max: 2 });
const client = await pool.connect();
const db = { executeSql: (text: string, values: unknown[]) => client.query(text, values) };

// 1. Rollback discards the job.
await client.query('begin');
const rolledBack = await boss.send(QUEUE, { case: 'rollback' }, { db });
assert.ok(rolledBack, 'send() returned no id');
await client.query('rollback');
assert.equal((await boss.findJobs(QUEUE, { id: rolledBack })).length, 0, 'job survived rollback');

// 2. Commit keeps the job.
await client.query('begin');
const committed = await boss.send(QUEUE, { case: 'commit' }, { db });
assert.ok(committed);
await client.query('commit');
assert.equal((await boss.findJobs(QUEUE, { id: committed })).length, 1, 'committed job missing');
report('s1.tx_semantics', { rollbackDiscards: true, commitPersists: true });

// 3. Enqueue cost inside a transaction (the API's hot path).
const sendMs: number[] = [];
for (let i = 0; i < 500; i++) {
  await client.query('begin');
  const t0 = performance.now();
  await boss.send(QUEUE, { case: 'latency', sentAt: Date.now() }, { db });
  sendMs.push(performance.now() - t0);
  await client.query('commit');
}
report('s1.send_in_tx_ms', { p50: percentile(sendMs, 50), p95: percentile(sendMs, 95), n: sendMs.length });
client.release();

// 4. Pickup latency with polling (LISTEN/NOTIFY is off by design).
const pollSeconds = Number(process.env.POLL_SECONDS ?? 2);
const pickupMs: number[] = [];
await boss.deleteQueuedJobs(QUEUE);
await new Promise<void>((resolve) => {
  void boss.work<{ sentAt: number }>(QUEUE, { pollingIntervalSeconds: pollSeconds }, async ([job]) => {
    if (job) pickupMs.push(Date.now() - job.data.sentAt);
    if (pickupMs.length === 50) resolve();
  });
  void (async () => {
    for (let i = 0; i < 50; i++) {
      await boss.send(QUEUE, { sentAt: Date.now() });
      await new Promise((r) => setTimeout(r, 100));
    }
  })();
});
report('s1.pickup_ms', { pollSeconds, p50: percentile(pickupMs, 50), p95: percentile(pickupMs, 95) });

// 5. Observation only: can the runtime role create queues? (Standard queues may be metadata-only.)
try { await boss.createQueue('s1_runtime_create'); report('s1.runtime_create_queue', { allowed: true }); }
catch (e) { report('s1.runtime_create_queue', { allowed: false, error: String(e) }); }

await boss.stop();
await pool.end();
