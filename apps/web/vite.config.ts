import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { configDefaults } from 'vitest/config';

/**
 * Content-Security-Policy of the built page. A landing page calls no API, so connect-src is the
 * page's own origin; add an origin here when the page starts calling one (a form endpoint, an
 * analytics host). 'unsafe-inline' styles: sonner inserts a <style> element. Scripts stay 'self'.
 */
const contentSecurityPolicy = () =>
  [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

/**
 * Adds the policy as a <meta> tag to the app's own index.html, in builds only: `pnpm dev` needs an
 * inline React Refresh script, and Storybook (which loads this config for its own pages) needs
 * inline scripts too. Headers in public/_headers would reach the Storybook deploy as well.
 */
const cspMetaTag = (): Plugin => {
  let appIndexHtml = '';
  let policy = '';

  return {
    name: 'csp-meta-tag',
    apply: 'build',
    configResolved: ({ root }) => {
      appIndexHtml = resolve(root, 'index.html');
      policy = contentSecurityPolicy();
    },
    transformIndexHtml: (html, { filename }) =>
      resolve(filename) === appIndexHtml
        ? [
            {
              tag: 'meta',
              attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
              injectTo: 'head-prepend',
            },
          ]
        : html,
  };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), cspMetaTag()],
  // Reads the `@/*` alias from tsconfig, so the alias is declared once.
  resolve: { tsconfigPaths: true },
  build: {
    rolldownOptions: {
      output: {
        // The libraries change far less often than the app: in chunks of their own, a deploy that
        // touches only app code leaves them cached (assets/* are immutable for a year, see
        // public/_headers). One app chunk was 160 kB gzip, almost all of it these libraries.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // `pnpm check` runs lint and typecheck alongside the tests (the builds come after, see the root
    // package.json). With a worker per core the machine was oversubscribed: workers failed to start
    // ("Failed to start forks worker") and lazy routes loaded past the findBy* timeout. Half the
    // cores leaves room for the rest.
    maxWorkers: '50%',
    // Above setup.ts's 5s findBy* timeout, so a slow element fails as a missing element (with the
    // DOM printed), not as a bare test timeout.
    testTimeout: 10_000,
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/features/**', 'src/lib/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.stories.tsx'],
      thresholds: { lines: 80 },
    },
    // .claude holds Claude Code skills, whose templates and examples contain their own tests;
    // e2e/ holds the Playwright tests (`pnpm test:e2e`).
    exclude: [...configDefaults.exclude, '.claude/**', 'e2e/**'],
  },
});
