import { defineConfig } from 'allure';

// The Allure 3 report of the Playwright run: `pnpm test:e2e:report` locally, the e2e jobs in CI.
export default defineConfig({
  name: 'web e2e',
  // Where allure-playwright writes (playwright.config.ts): inside Playwright's outputDir, which it
  // empties at the start of every run, so a report never mixes in an older run's results.
  resultsDir: 'test-results/allure',
  output: 'allure-report',
  // One line per run, read for the trend charts and the flaky / new-failure markers. CI carries it
  // from run to run in the Actions cache (.github/workflows/ci.yml).
  historyPath: 'allure-history.jsonl',
  historyLimit: 30,
  plugins: {
    // One self-contained index.html: it opens from a downloaded CI artifact, with no server.
    awesome: { options: { singleFile: true } },
  },
});
