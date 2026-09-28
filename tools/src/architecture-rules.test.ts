// Proves every architecture rule fires on its violation fixture and stays silent on compliant ones.
// Each fixture declares its expected findings on line 1; the reported rule SET must match exactly.
import { spawnSync } from 'node:child_process';
import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

type Findings = Record<string, string[]>; // fixture path (posix, relative to its root) -> sorted rule names
type Tag = '@expect-lint' | '@expect-dep';

interface DepcruiseOutput {
  summary: {
    violations: ReadonlyArray<{
      from: string;
      rule: { name: string };
      cycle?: ReadonlyArray<{ name: string }>;
    }>;
  };
}

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const fixturesRoot = path.join(repoRoot, 'tools', 'arch-fixtures');
const toPosix = (p: string): string => p.replaceAll('\\', '/');
const byName = (a: string, b: string): number => a.localeCompare(b);

function readExpectations(root: string, tag: Tag): Findings {
  const expected: Findings = {};
  for (const file of globSync('**/*.ts', { cwd: root })) {
    const firstLine = readFileSync(path.join(root, file), 'utf8').split('\n', 1)[0]?.trim() ?? '';
    const prefix = `// ${tag} `;
    const declared = firstLine.startsWith(prefix) ? firstLine.slice(prefix.length).trim() : '';
    if (declared === '') {
      throw new Error(`${file}: first line must be "${prefix}<rule[, rule]|none>"`);
    }
    expected[toPosix(file)] =
      declared === 'none'
        ? []
        : declared
            .split(',')
            .map((rule) => rule.trim())
            .sort(byName);
  }
  return expected;
}

function normalize(findings: Map<string, Set<string>>): Findings {
  return Object.fromEntries([...findings].map(([file, rules]) => [file, [...rules].sort(byName)]));
}

describe('architecture rules (ADR-021)', () => {
  it('ESLint reports exactly the declared rules for every fixture', async () => {
    const root = path.join(fixturesRoot, 'eslint');
    const eslint = new ESLint({ cwd: repoRoot, ignore: false });
    const results = await eslint.lintFiles([`${toPosix(path.relative(repoRoot, root))}/**/*.ts`]);

    const actual = new Map<string, Set<string>>();
    for (const result of results) {
      const rules = result.messages.map((message) => message.ruleId ?? `fatal: ${message.message}`);
      actual.set(toPosix(path.relative(root, result.filePath)), new Set(rules));
    }
    expect(normalize(actual)).toEqual(readExpectations(root, '@expect-lint'));
  }, 120_000);

  it('dependency-cruiser reports exactly the declared rules for every fixture', () => {
    const root = path.join(fixturesRoot, 'depcruise');
    const expected = readExpectations(root, '@expect-dep');
    const config = toPosix(path.relative(root, path.join(repoRoot, '.dependency-cruiser.cjs')));

    // Exit code is ignored on purpose: violations (the point of the fixtures) make it non-zero.
    const run = spawnSync(`pnpm exec depcruise --config ${config} --output-type json apps packages`, {
      cwd: root,
      encoding: 'utf8',
      shell: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (run.error) throw run.error;
    if (run.stdout === '') throw new Error(`dependency-cruiser produced no output:\n${run.stderr}`);
    const output = JSON.parse(run.stdout) as DepcruiseOutput;

    const actual = new Map<string, Set<string>>(Object.keys(expected).map((file) => [file, new Set()]));
    for (const violation of output.summary.violations) {
      const from = toPosix(violation.from);
      const rules = actual.get(from) ?? new Set<string>();
      rules.add(violation.rule.name);
      actual.set(from, rules);
      if (violation.cycle) {
        for (const step of violation.cycle) {
          const stepName = toPosix(step.name);
          const stepRules = actual.get(stepName) ?? new Set<string>();
          stepRules.add(violation.rule.name);
          actual.set(stepName, stepRules);
        }
      }
    }
    expect(normalize(actual)).toEqual(expected);
  }, 60_000);
});
