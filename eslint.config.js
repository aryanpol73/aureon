// Strict typed linting + ADR-021 architecture restrictions.
// Flat config REPLACES a rule's options per matching block, so every scope lists its full selector set.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// ── Restricted modules (regex, so "ai" does not also match "@aureon/ai") ──
const DB_MODULES = {
  regex: '^(pg|pg-boss|postgres)$|^drizzle-orm(/.*)?$',
  message: 'Database access belongs in modules/*/infrastructure or packages/platform/src/db (ADR-021).',
};
const AI_SDK_MODULES = {
  regex:
    '^(openai|ai|groq-sdk|cohere-ai|voyageai)(/.*)?$|^@(anthropic-ai|ai-sdk|mistralai)/|^@google/(genai|generative-ai)(/.*)?$',
  message: 'Provider SDKs may only be imported inside packages/ai (ADR-010, ADR-021).',
};
const NODE_CRYPTO = {
  regex: '^(node:)?crypto$',
  message: 'Domain/application code gets randomness and IDs through injected ports.',
};
const BACKEND_PACKAGES = {
  regex: '^@aureon/(core|ai|platform)(/.*)?$',
  message: 'apps/web may only import @aureon/contracts; data comes from the API.',
};

// ── Restricted syntax ──
const DYNAMIC_IMPORT = {
  selector: "ImportExpression[source.type!='Literal']",
  message: 'Computed dynamic imports bypass dependency boundary checks.',
};
const SQL_RAW = {
  selector: "MemberExpression[object.name='sql'][property.name='raw']",
  message: 'sql.raw() disables parameterization; only SQL migrations may contain raw SQL.',
};
const NONDETERMINISM = [
  { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Inject the Clock port.' },
  { selector: "CallExpression[callee.name='Date']", message: 'Inject the Clock port.' },
  {
    selector: "MemberExpression[object.name='Date'][property.name='now']",
    message: 'Inject the Clock port.',
  },
  { selector: "MemberExpression[object.name='Math'][property.name='random']", message: 'Inject a port.' },
  { selector: "MemberExpression[property.name='randomUUID']", message: 'Inject the IdGenerator port.' },
];

const restrictImports = (...patterns) => ['error', { patterns }];
const restrictSyntax = (...selectors) => ['error', ...selectors];

// Globs start with **/ so the fixture tree gets exactly the same scoping as real paths.
const DOMAIN_AND_APPLICATION = ['**/modules/*/domain/**/*.ts', '**/modules/*/application/**/*.ts'];
const DB_INFRASTRUCTURE = ['**/modules/*/infrastructure/**/*.ts', '**/platform/src/db/**/*.ts'];
const AI_PACKAGE = ['**/packages/ai/**/*.ts'];
const CONFIG_LOADER = ['**/platform/src/config/**/*.ts'];
const WEB = ['**/apps/web/**/*.{ts,tsx}'];

export default defineConfig(
  { ignores: ['**/dist/**', '**/.next/**', '**/coverage/**', '**/.turbo/**', 'tools/arch-fixtures/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 10 },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': restrictImports(DB_MODULES, AI_SDK_MODULES),
      'no-restricted-syntax': restrictSyntax(DYNAMIC_IMPORT, SQL_RAW),
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read configuration via packages/platform/src/config.',
        },
      ],
    },
  },
  { files: DB_INFRASTRUCTURE, rules: { 'no-restricted-imports': restrictImports(AI_SDK_MODULES) } },
  { files: AI_PACKAGE, rules: { 'no-restricted-imports': restrictImports(DB_MODULES) } },
  {
    files: DOMAIN_AND_APPLICATION,
    rules: {
      'no-restricted-imports': restrictImports(DB_MODULES, AI_SDK_MODULES, NODE_CRYPTO),
      'no-restricted-syntax': restrictSyntax(DYNAMIC_IMPORT, SQL_RAW, ...NONDETERMINISM),
    },
  },
  { files: CONFIG_LOADER, rules: { 'no-restricted-properties': 'off' } },
  {
    files: WEB,
    rules: { 'no-restricted-imports': restrictImports(DB_MODULES, AI_SDK_MODULES, BACKEND_PACKAGES) },
  },
);
