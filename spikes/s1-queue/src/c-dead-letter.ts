// spikes/s1-queue/src/c-dead-letter.ts
// Checks: exhausted retries move the job to the DLQ with provenance.
import assert from 'node:assert/strict';
import { installAsOwner, report, runtimeBoss } from './common.js';

await installAsOwner([
  { name: 's1_dlq' }, // must exist before it is referenced
  { name: 's1_fail', options: { retryLimit: 2, retryDelay: 1, retryBackoff: true, deadLetter: 's1_dlq' } },
]);
const boss = runtimeBoss();
await boss.start();

let attempts = 0;
await boss.work('s1_fail', async () => { attempts++; throw new Error('permanent failure (spike)'); });
const started = Date.now();
const id = await boss.send('s1_fail', { case: 'dlq' });

const dead = await new Promise<{ sourceId: string | null }>((resolve) => {
  void boss.work('s1_dlq', { includeMetadata: true }, async ([job]) => { if (job) resolve(job as unknown as { sourceId: string | null }); });
});
assert.equal(dead.sourceId, id, 'DLQ job lost its source id');
assert.equal(attempts, 3, 'expected 1 attempt + 2 retries');
report('s1.dead_letter', { attempts, msToDeadLetter: Date.now() - started });
await boss.stop();
