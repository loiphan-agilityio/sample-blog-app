import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL points the tests at a running app: CI sets it to the production URL. Without it,
// Playwright builds the landing page (`pnpm build`: it has no mocks) and serves it with
// `vite preview`, the same build CI deploys. It builds into `dist-e2e/`, not `dist/`: `pnpm check`
// runs `build` alongside, and both writing `dist/` left whichever finished last there (and in
// turbo's cache of `build`).
// An empty value (`E2E_BASE_URL=`, an empty CI output) counts as unset, as in `webServer` below.
const deployedUrl = process.env.E2E_BASE_URL === '' ? undefined : process.env.E2E_BASE_URL;
const isCI = Boolean(process.env.CI);

// GitHub Actions turns the github reporter's lines into annotations; elsewhere they are noise.
const onGitHub = Boolean(process.env.GITHUB_ACTIONS);

// tools/check-report.mjs sets the json reporter's output file to read the pass rate. Added here,
// not with --reporter on the command line, which would replace the reporters above (CI's
// annotations and the Allure results its report is built from).
const jsonReport = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ? [['json'] as const] : [];
const port = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: [
    onGitHub ? ['github'] : ['list'],
    // Read by `allure generate` (allurerc.ts), which builds the Allure 3 report from them.
    ['allure-playwright', { resultsDir: 'test-results/allure' }],
    ...jsonReport,
  ],
  use: {
    baseURL: deployedUrl ?? `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: deployedUrl
    ? []
    : {
        // A landing page has no API to mock: e2e tests the production build.
        command: `pnpm build --outDir dist-e2e && pnpm preview --outDir dist-e2e --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        // Never test a server that is already running on the port (a `pnpm preview` of a production
        // build, another project's e2e run): a busy port fails with Playwright's "already used".
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
