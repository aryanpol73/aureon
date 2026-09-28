# Getting Started

## Prerequisites

- **Node.js**: 24.x LTS (use `nvm use` with `.nvmrc`)
- **pnpm**: 12.6.0 (`corepack enable` or `npm install -g pnpm@12.6.0`)

## Installation

Clone the repository and install dependencies with frozen lockfile:

```bash
pnpm install --frozen-lockfile
```

## Running Verification

Run the full verification suite (Prettier check, TypeScript typecheck across all packages, Vitest unit test suite):

```bash
pnpm check
```

Or individual tasks:

```bash
pnpm format:check   # Verify formatting
pnpm format         # Auto-format all files
pnpm typecheck      # Run tsc across all workspace packages via Turbo
pnpm test           # Run Vitest test suites via Turbo
```
