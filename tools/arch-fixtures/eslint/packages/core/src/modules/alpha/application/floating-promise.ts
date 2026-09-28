// @expect-lint @typescript-eslint/no-floating-promises
const work = (): Promise<void> => Promise.resolve();
export function start(): void {
  work();
}
