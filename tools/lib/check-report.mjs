// The pure parts of tools/check-report.mjs: what each gate's output means and how the checklist
// reads. Tested in tools/test/check-report.test.mjs; the CLI runs the commands.

/** @type {(passed: number, total: number) => string} */
export const rate = (passed, total) =>
  total === 0
    ? 'no tests'
    : `${Math.round((passed / total) * 1000) / 10}% (${passed}/${total} passed)`;

/**
 * Vitest's JSON report and the coverage summary, as the unit gate's result and note.
 * @param {{ numPassedTests: number, numTotalTests: number } | undefined} results
 * @param {{ total?: { lines?: { pct?: number } } } | undefined} coverage
 */
export const unitDetail = (results, coverage) => {
  const lines = coverage?.total?.lines?.pct;

  return {
    result: results ? rate(results.numPassedTests, results.numTotalTests) : 'no results',
    note: lines === undefined ? '' : `line coverage ${lines}%`,
  };
};

/**
 * Playwright's JSON `stats`, as the e2e gate's result and note. Flaky tests passed on a retry:
 * they count against the pass rate and are named in the note.
 * @param {{ expected: number, unexpected: number, flaky: number, skipped: number } | undefined} stats
 */
export const e2eDetail = (stats) => {
  if (!stats) return { result: 'no results', note: '' };

  const total = stats.expected + stats.unexpected + stats.flaky;

  return {
    result: rate(stats.expected, total),
    note: [
      stats.flaky > 0 && `${stats.flaky} flaky`,
      stats.skipped > 0 && `${stats.skipped} skipped`,
    ]
      .filter(Boolean)
      .join(', '),
  };
};

/**
 * The gates `--only` and `--skip` leave, in their order. A name that is no gate, or a selection
 * that leaves none, throws: a typo in CI must not turn the step into a green no-op.
 * @template {{ id: string }} G
 * @param {G[]} gates
 * @param {string | undefined} only comma-separated ids
 * @param {string | undefined} skip comma-separated ids
 */
export const selectGates = (gates, only, skip) => {
  const listed = (/** @type {string | undefined} */ list) => new Set(list?.split(',') ?? []);
  const keep = listed(only);
  const drop = listed(skip);
  const ids = new Set(gates.map(({ id }) => id));
  const unknown = [...keep, ...drop].filter((id) => !ids.has(id));

  if (unknown.length > 0) {
    throw new Error(`no gate named ${unknown.join(', ')} (gates: ${[...ids].join(', ')})`);
  }

  const selected = gates.filter(({ id }) => (keep.size === 0 || keep.has(id)) && !drop.has(id));

  if (selected.length === 0) throw new Error('--only and --skip leave no gate to run');

  return selected;
};

/**
 * One checklist row. A failed gate's result starts with FAIL, followed by its measured result
 * when it has one (`FAIL: 97.5% (39/40 passed)`), never by a second FAIL.
 * @param {{ id: string, name: string }} gate
 * @param {boolean} ok
 * @param {{ result: string, note: string } | undefined} detail
 * @param {number} seconds
 */
export const toRow = (gate, ok, detail, seconds) => {
  const { result, note } = detail ?? { result: 'pass', note: '' };

  return {
    gate: gate.id,
    name: gate.name,
    ok,
    result: ok ? result : `FAIL${result === 'pass' ? '' : `: ${result}`}`,
    note,
    seconds,
  };
};

/** @param {ReturnType<typeof toRow>[]} rows */
export const toMarkdown = (rows) => {
  const failed = rows.filter((row) => !row.ok);

  return [
    '## Check report',
    '',
    '| Gate | Status | Result | Time |',
    '|---|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${row.name} | ${row.ok ? 'pass' : 'FAIL'} | ${[row.result, row.note].filter(Boolean).join('; ')} | ${row.seconds}s |`,
    ),
    '',
    failed.length === 0
      ? `All ${rows.length} gates pass.`
      : `${failed.length} of ${rows.length} gates failed: ${failed.map((row) => row.name).join(', ')}.`,
    '',
  ].join('\n');
};
