// @expect-lint no-restricted-syntax
export async function load(specifier: string): Promise<void> {
  await import(specifier);
}
