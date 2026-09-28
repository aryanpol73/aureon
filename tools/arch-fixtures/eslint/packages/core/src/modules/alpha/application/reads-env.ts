// @expect-lint no-restricted-properties
export const databaseUrl: string | undefined = process.env['DATABASE_URL'];
