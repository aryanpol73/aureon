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
  const done = new Promise<void>((r) => { resolveNext = r; });
  await boss.send(QUEUE, { sentAt: Date.now() });
  await done;
}
report('s1b.idle_pickup_ms', { pollSeconds, p50: percentile(idleMs, 50), p95: percentile(idleMs, 95) });
await boss.offWork(QUEUE, { id: workerId });

// Phase 2: drain throughput. Enqueue first, then start the worker.
const N = Number(process.env.JOBS ?? 500);
await boss.insert(QUEUE, Array.from({ length: N }, () => ({ data: { sentAt: 0 } })));
let processed = 0;
const t0 = performance.now();
await new Promise<void>((resolve) => {
  void boss.work(QUEUE, { pollingIntervalSeconds: pollSeconds, batchSize, localConcurrency }, async (jobs) => {
    processed += jobs.length;
    if (processed >= N) resolve();
  });
});
const seconds = (performance.now() - t0) / 1000;
report('s1b.drain', { pollSeconds, batchSize, localConcurrency, jobs: N, seconds, jobsPerSecond: N / seconds });
await boss.stop();
