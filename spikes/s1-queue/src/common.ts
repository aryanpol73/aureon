// spikes/s1-queue/src/common.ts
import { PgBoss } from 'pg-boss';

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}
export const OWNER_URL = env('OWNER_URL');
export const APP_URL = env('APP_URL');

type QueueOptions = Parameters<PgBoss['createQueue']>[1];

/** Release-step simulation: the schema and queues are created by the owner role only. */
export async function installAsOwner(queues: ReadonlyArray<{ name: string; options?: QueueOptions }>): Promise<void> {
  const installer = new PgBoss({ connectionString: OWNER_URL, supervise: false });
  await installer.start();
  for (const q of queues) {
    if (!(await installer.getQueue(q.name))) await installer.createQueue(q.name, q.options);
    else if (q.options) await installer.updateQueue(q.name, q.options);
  }
  await installer.stop();
}

/** Runtime role: must work without any DDL privileges. */
export function runtimeBoss(): PgBoss {
  const boss = new PgBoss({ connectionString: APP_URL, createSchema: false, application_name: 'aureon-spike' });
  boss.on('error', (e) => console.error('[boss:error]', e));
  boss.on('warning', (w) => console.warn('[boss:warning]', w));
  return boss;
}

export function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? Number.NaN;
}
export const report = (name: string, data: Record<string, unknown>): void =>
  console.log(`RESULT ${name} ${JSON.stringify(data)}`);
