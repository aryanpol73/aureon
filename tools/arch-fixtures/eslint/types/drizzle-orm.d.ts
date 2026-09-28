// @expect-lint none
declare module 'drizzle-orm' {
  export interface SQL {
    readonly brand: 'sql';
  }
  export const sql: { raw(value: string): SQL };
}
