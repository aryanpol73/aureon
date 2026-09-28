# Aureon Toolchain & Dependencies

This file records the exact toolchain and dependency versions resolved by the lockfile (`pnpm-lock.yaml`). Per ADR-022, versions are never typed from memory and this file is the project's recorded baseline.

## Runtime & Tooling

| Tool        | Version   | Notes                                                                          |
| ----------- | --------- | ------------------------------------------------------------------------------ |
| Node.js     | `24.13.1` | Node 24 LTS (`.nvmrc: 24`, pinned in `engines`)                                |
| pnpm        | `12.6.0`  | Pinned via `packageManager` in `package.json`                                  |
| Turborepo   | `2.11.4`  | Monorepo build orchestrator                                                    |
| TypeScript  | `6.0.3`   | Stable 6.x release (avoids TS 7 typescript-eslint incompatibility per ADR-022) |
| Vitest      | `5.0.2`   | Unit test runner                                                               |
| Prettier    | `3.9.9`   | Code formatter (`printWidth: 110`, `singleQuote: true`, `eol: lf`)             |
| @types/node | `26.6.2`  | Type definitions for Node.js runtime                                           |

## Packages Baseline

### `@aureon/platform`

- `typescript`: `6.0.3`
- `vitest`: `5.0.2`
