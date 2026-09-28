// @expect-lint no-restricted-syntax
import { sql } from 'drizzle-orm';
export const query: unknown = sql.raw('select 1');
