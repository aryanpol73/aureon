// spikes/s1-queue/src/b-crash-harness.ts
// Checks: a job held by a SIGKILLed worker is redelivered via heartbeat expiry, not the 15-minute expiration.
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installAsOwner, report, runtimeBoss } from './common.js';

const QUEUE = 's1_crash';
const heartbeatSeconds = Number(process.env.HEARTBEAT_SECONDS ?? 30);
await installAsOwner([{ name: QUEUE, options: { heartbeatSeconds, expireInSeconds: 900, retryLimit: 3, retryDelay: 1 } }]);

const boss = runtimeBoss();
await boss.start(); // this instance supervises (runs the monitor)
const jobId = await boss.send(QUEUE, { case: 'crash' });

const workerPath = fileURLToPath(new URL('./b-crash-worker.ts', import.meta.url));
const child = fork(workerPath, { execArgv: ['--import', 'tsx'] });
const killedAt = await new Promise<number>((resolve) => {
  child.on('message', (msg: unknown) => {
    if (typeof msg === 'object' && msg !== null && 'picked' in msg && msg.picked === jobId) {
      child.kill('SIGKILL');
      resolve(Date.now());
    }
  });
});

const recoveredAt = await new Promise<number>((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('not recovered within 10 minutes')), 600_000);
  void boss.work(QUEUE, async ([job]) => {
    if (job?.id === jobId) { clearTimeout(timeout); resolve(Date.now()); }
  });
});
report('s1.crash_recovery', { heartbeatSeconds, recoveryMs: recoveredAt - killedAt });
await boss.stop();
