// Internal boundaries (ADR-001, ADR-010, ADR-014, ADR-021).
// Paths are relative to the working directory, so the same rules apply to the fixture tree.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'not-to-unresolvable',
      comment: 'Also the canary for broken .js -> .ts resolution.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'module-public-api',
      comment: "Modules import each other only through the other module's index.ts.",
      severity: 'error',
      from: { path: '^packages/core/src/modules/([^/]+)/' },
      to: {
        path: '^packages/core/src/modules/[^/]+/',
        pathNot: '^packages/core/src/modules/($1/|[^/]+/index\\.ts$)',
      },
    },
    {
      name: 'domain-purity',
      comment: 'Domain depends only on its own domain and the kernel: no npm packages, no Node built-ins.',
      severity: 'error',
      from: { path: '^packages/core/src/modules/([^/]+)/domain/', pathNot: '\\.test\\.ts$' },
      to: { pathNot: '^packages/core/src/modules/$1/domain/|^packages/platform/src/kernel/' },
    },
    {
      name: 'application-not-infrastructure',
      severity: 'error',
      from: { path: '^packages/core/src/modules/([^/]+)/application/' },
      to: { path: '^packages/core/src/modules/$1/(infrastructure|presentation)/' },
    },
    {
      name: 'application-no-db',
      comment: 'Application code reaches the database only through ports implemented in infrastructure.',
      severity: 'error',
      from: { path: '^packages/core/src/modules/[^/]+/(domain|application)/' },
      to: { path: '^packages/platform/src/db/' },
    },
    {
      name: 'context-engine-no-db',
      comment: "ADR-014: the Context Engine gathers only through other modules' authorized query services.",
      severity: 'error',
      from: { path: '^packages/core/src/modules/context/' },
      to: { path: '^packages/platform/src/db/|(^|/)node_modules/(pg|pg-boss|drizzle-orm|postgres)/' },
    },
    {
      name: 'kernel-standalone',
      severity: 'error',
      from: { path: '^packages/platform/src/kernel/', pathNot: '\\.test\\.ts$' },
      to: { pathNot: '^packages/platform/src/kernel/' },
    },
    {
      name: 'platform-not-to-domain',
      severity: 'error',
      from: { path: '^packages/platform/' },
      to: { path: '^packages/(core|ai)/' },
    },
    {
      name: 'ai-no-domain',
      severity: 'error',
      from: { path: '^packages/ai/' },
      to: { path: '^packages/core/' },
    },
    {
      name: 'ai-adapters-private',
      comment: 'ADR-010: providers are reachable only via the gateway (reserve -> call -> settle).',
      severity: 'error',
      from: { pathNot: '^packages/ai/' },
      to: { path: '^packages/ai/src/', pathNot: '^packages/ai/src/index\\.ts$' },
    },
    {
      name: 'contracts-standalone',
      severity: 'error',
      from: { path: '^packages/contracts/' },
      to: { path: '^packages/(core|ai|platform)/' },
    },
    {
      name: 'web-presentation-only',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^packages/', pathNot: '^packages/contracts/' },
    },
    {
      name: 'no-app-imports',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
  ],
  options: {
    tsPreCompilationDeps: true, // type-only imports count: boundaries apply to types too
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|\\.next|coverage)/' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'default'],
    },
  },
};
