import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  e2eDetail,
  rate,
  selectGates,
  toMarkdown,
  toRow,
  unitDetail,
} from '../lib/check-report.mjs';

describe('check-report', () => {
  it('rates to one decimal and says when there is nothing to rate', () => {
    assert.equal(rate(39, 40), '97.5% (39/40 passed)');
    assert.equal(rate(2, 3), '66.7% (2/3 passed)');
    assert.equal(rate(0, 0), 'no tests');
  });

  it('reads the unit result and coverage, or says they are missing', () => {
    assert.deepEqual(
      unitDetail({ numPassedTests: 43, numTotalTests: 43 }, { total: { lines: { pct: 88.34 } } }),
      { result: '100% (43/43 passed)', note: 'line coverage 88.34%' },
    );
    assert.deepEqual(unitDetail(undefined, undefined), { result: 'no results', note: '' });
  });

  it('counts a flaky e2e test against the pass rate and names flaky and skipped tests', () => {
    assert.deepEqual(e2eDetail({ expected: 5, unexpected: 0, flaky: 1, skipped: 2 }), {
      result: '83.3% (5/6 passed)',
      note: '1 flaky, 2 skipped',
    });
    assert.deepEqual(e2eDetail(undefined), { result: 'no results', note: '' });
  });

  it('keeps the gates --only names, minus those --skip names, in their order', () => {
    const gates = ['lint', 'unit', 'build', 'e2e'].map((id) => ({ id }));
    const ids = (only, skip) => selectGates(gates, only, skip).map(({ id }) => id);

    assert.deepEqual(ids(undefined, undefined), ['lint', 'unit', 'build', 'e2e']);
    assert.deepEqual(ids('e2e,lint', undefined), ['lint', 'e2e']);
    assert.deepEqual(ids(undefined, 'e2e'), ['lint', 'unit', 'build']);
  });

  it('refuses a gate name that is not one, and a selection that leaves none', () => {
    const gates = ['lint', 'e2e'].map((id) => ({ id }));

    assert.throws(() => selectGates(gates, 'lnt', undefined), /no gate named lnt/);
    assert.throws(() => selectGates(gates, undefined, 'e3e'), /no gate named e3e/);
    assert.throws(() => selectGates(gates, 'e2e', 'e2e'), /leave no gate/);
  });

  it('writes FAIL once, then the measured result when the gate has one', () => {
    const gate = { id: 'unit', name: 'Unit tests' };

    assert.equal(toRow(gate, false, undefined, 1).result, 'FAIL');
    assert.equal(
      toRow(gate, false, { result: '97.5% (39/40 passed)', note: '' }, 1).result,
      'FAIL: 97.5% (39/40 passed)',
    );
    assert.equal(toRow(gate, true, undefined, 1).result, 'pass');
  });

  it('ends the checklist with which gates failed', () => {
    const rows = [
      toRow({ id: 'lint', name: 'Lint' }, true, undefined, 3),
      toRow({ id: 'unit', name: 'Unit tests' }, false, { result: 'no results', note: '' }, 4),
    ];

    const markdown = toMarkdown(rows);

    assert.match(markdown, /\| Unit tests \| FAIL \| FAIL: no results \| 4s \|/);
    assert.match(markdown, /1 of 2 gates failed: Unit tests\./);
    assert.match(toMarkdown(rows.slice(0, 1)), /All 1 gates pass\./);
  });
});

describe('check-report.mjs', () => {
  const script = fileURLToPath(new URL('../check-report.mjs', import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), 'check-report-test-'));

  after(() => rmSync(dir, { recursive: true, force: true }));

  /**
   * Runs the script in an empty folder, with a temp folder of its own: returns its exit code and
   * the check-report folders it left there.
   */
  const run = (/** @type {string[]} */ args) => {
    const temp = mkdtempSync(join(dir, 'tmp-'));
    const cwd = mkdtempSync(join(dir, 'cwd-'));

    const { status } = spawnSync(process.execPath, [script, ...args], {
      cwd,
      env: { ...process.env, TMPDIR: temp, TEMP: temp, TMP: temp },
      stdio: 'ignore',
    });

    return { status, left: readdirSync(temp).filter((name) => name.startsWith('check-report-')) };
  };

  it('removes its temp folder after a run, and when it refuses a gate name', () => {
    // `pnpm lint` fails at once in an empty folder: a full run with one failing gate.
    assert.deepEqual(run(['--only', 'lint']), { status: 1, left: [] });
    assert.deepEqual(run(['--only', 'lnt']), { status: 2, left: [] });
  });
});
