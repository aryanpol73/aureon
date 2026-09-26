// spikes/s2-db/src/tenant.ts: candidate for packages/platform/db
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export interface TenantContext { readonly workspaceId: string; readonly userId: string }

/** All tenant data access goes through here. is_local=true scopes the settings to this transaction. */
export function withTenant<T>(db: Db, ctx: TenantContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.workspace_id', ${ctx.workspaceId}, true),
                                set_config('app.user_id', ${ctx.userId}, true)`);
    return fn(tx);
  });
}
