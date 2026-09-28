// @expect-lint no-restricted-imports
import { randomBytes } from 'node:crypto';
export const token = (): string => randomBytes(8).toString('hex');
