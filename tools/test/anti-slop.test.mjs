import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'anti-slop-'));

after(() => rmSync(dir, { recursive: true, force: true }));

// One violation per rule below, from both plugin entry points (generic and Effect), including a
// rule that reads comments. Written outside the repository: inside it, `pnpm lint` would reject it.
const probe = `import { Data } from 'effect';

export class NotFound extends Data.TaggedError('NotFound')<object> {}

export const isNotFound = (error: { _tag: string }) => error._tag === 'NotFound';
export const tagged = { _tag: 'NotFound' };
export const twice = (value: string | number) => value as unknown as boolean;
export const once = (value: string | number) => value as string;
export const checked = (value: string | number) =>
  // SAFETY: callers pass only strings here.
  value as string;
export const take = (value: unknown) => value;
export const keys = (shape: object) => Object.keys(shape);
export const isText = (value: string | number) => typeof value === 'string';
export const spaced = (value: number) => {
  const next = value + 1;
  if (next > 2) return next;
  return value;
};
`;

/** The rule id of each diagnostic Oxlint reports for the probe. */
const reportedRules = () => {
  const file = join(dir, 'probe.ts');

  writeFileSync(file, probe);

  // The repository's own oxlint (package.json pins it), run by Node, with oxlint.config.ts.
  const oxlint = join(root, 'node_modules', 'oxlint', 'bin', 'oxlint');

  const run = spawnSync(
    process.execPath,
    [oxlint, '-c', 'oxlint.config.ts', '--format=json', file],
    { cwd: root, encoding: 'utf8' },
  );

  const report = JSON.parse(run.stdout);

  return report.diagnostics.map((diagnostic) => diagnostic.code);
};

describe('anti-slop', () => {
  it('still reports each rule after an oxlint upgrade (a plugin that fails to load reports nothing)', () => {
    const reported = reportedRules();
    const fired = new Set(reported);

    for (const rule of [
      'anti-slop(no-chained-type-assertions)',
      'anti-slop(no-object-parameters)',
      'anti-slop(no-runtime-typeof)',
      'anti-slop(no-unknown-parameters)',
      'anti-slop(require-readable-spacing)',
      'anti-slop(require-safety-comment-for-type-assertion)',
      'anti-slop-effect(no-manual-tag-comparison)',
      'anti-slop-effect(no-manual-tagged-construction)',
    ]) {
      assert.ok(fired.has(rule), `${rule} did not fire; reported: ${[...fired].join(', ')}`);
    }

    // Comments are read: `twice` (two assertions) and `once` are reported, `checked`, whose
    // assertion has a SAFETY comment, is not.
    assert.equal(
      reported.filter((rule) => rule === 'anti-slop(require-safety-comment-for-type-assertion)')
        .length,
      3,
    );
  });
});
