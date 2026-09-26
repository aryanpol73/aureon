// spikes/s1-queue/src/b-crash-worker.ts: picks the job, reports it, then hangs until SIGKILL.
import { runtimeBoss } from './common.js';
const boss = runtimeBoss();
await boss.start();
await boss.work('s1_crash', async ([job]) => {
  process.send?.({ picked: job?.id });
  await new Promise<never>(() => {}); // the heartbeat keeps running until the process is killed
});
