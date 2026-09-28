// @expect-lint no-restricted-syntax
export const newId = (): string => crypto.randomUUID();
