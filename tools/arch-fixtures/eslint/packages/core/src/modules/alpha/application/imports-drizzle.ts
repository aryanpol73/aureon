// @expect-lint no-restricted-imports
import { sql } from 'drizzle-orm';
export const query: unknown = sql;
