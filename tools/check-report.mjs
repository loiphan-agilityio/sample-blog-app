#!/usr/bin/env node
// pnpm check:report: runs the gates of pnpm check one after another, keeps going after a failure,
// and prints the output checklist: lint (Oxlint with anti-slop, Prettier), typecheck, unit tests with
// their pass rate and line coverage, build, Storybook build, and e2e with its pass rate.
//
//   node tools/check-report.mjs [--only <gate,...>] [--skip <gate,...>]
//
// Gates: lint, typecheck, unit, build, storybook, e2e. The checklist is Markdown on stdout, is
// appended to $GITHUB_STEP_SUMMARY when CI sets it, and is written as JSON to check-report.json.
// Exits 1 when a gate fails, 2 for a gate name that is not one. What the results mean lives in
// tools/lib/check-report.mjs (tested).
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { e2eDetail, selectGates, toMarkdown, toRow, unitDetail } from './lib/check-report.mjs';

const { values } = parseArgs({
  options: { only: { type: 'string' }, skip: { type: 'string' } },
});

// The gates' JSON reports, read into the checklist; the folder goes when the script exits.
const out = mkdtempSync(join(tmpdir(), 'check-report-'));

process.on('exit', () => rmSync(out, { recursive: true, force: true }));

const vitestJson = join(out, 'vitest.json');

// Coverage stays where `pnpm test` writes it (CI uploads apps/web/coverage/), with a summary added.
const coverageDir = join('apps', 'web', 'coverage');
const e2eJson = join(out, 'e2e.json');
const quote = (/** @type {string} */ path) => JSON.stringify(path);

/** @type {(path: string) => any} */
const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined);

const gates = [
  { id: 'lint', name: 'Lint (Oxlint, Prettier)', command: 'pnpm lint' },
  { id: 'typecheck', name: 'Typecheck', command: 'pnpm typecheck' },
  {
    id: 'unit',
    name: 'Unit tests',
    command: [
      'pnpm --filter web exec vitest run --coverage',
      '--coverage.reporter=text --coverage.reporter=html --coverage.reporter=json-summary',
      `--reporter=default --reporter=json --outputFile.json=${quote(vitestJson)}`,
    ].join(' '),
    detail: () =>
      unitDetail(readJson(vitestJson), readJson(join(coverageDir, 'coverage-summary.json'))),
  },
  { id: 'build', name: 'Build', command: 'pnpm build' },
  { id: 'storybook', name: 'Storybook build', command: 'pnpm build-storybook' },
  {
    id: 'e2e',
    name: 'E2E (Playwright)',
    // The json reporter comes from playwright.config.ts when PLAYWRIGHT_JSON_OUTPUT_NAME is set: a
    // --reporter here would drop the config's (CI's annotations, the Allure results).
    command: 'pnpm --filter web exec playwright test',
    env: { PLAYWRIGHT_JSON_OUTPUT_NAME: e2eJson },
    detail: () => e2eDetail(readJson(e2eJson)?.stats),
  },
];

/** @type {typeof gates} */
let selected = [];

try {
  selected = selectGates(gates, values.only, values.skip);
} catch (cause) {
  console.error(`check-report: ${cause instanceof Error ? cause.message : String(cause)}`);
  process.exit(2);
}

const rows = selected.map((gate) => {
  console.log(`\n▶ ${gate.name}: ${gate.command}`);
  const started = Date.now();

  const { status } = spawnSync(gate.command, {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, ...gate.env },
  });

  return toRow(gate, status === 0, gate.detail?.(), Math.round((Date.now() - started) / 1000));
});

const markdown = toMarkdown(rows);

console.log(`\n${markdown}`);

writeFileSync('check-report.json', `${JSON.stringify({ gates: rows }, null, 2)}\n`);

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);

process.exitCode = rows.every((row) => row.ok) ? 0 : 1;
