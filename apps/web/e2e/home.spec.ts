import { expect, test } from '@playwright/test';

test('renders the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /people understand/ })).toBeVisible();
});

// The tab and home-screen icons and the web app manifest are real files, not the SPA's index.html.
test('serves its icons and web app manifest', async ({ request }) => {
  for (const [path, type] of [
    ['/favicon.svg', 'image/svg+xml'],
    ['/apple-touch-icon.png', 'image/png'],
    ['/icon-192.png', 'image/png'],
    ['/icon-512.png', 'image/png'],
    ['/site.webmanifest', 'application/manifest+json'],
  ] as const) {
    const response = await request.get(path);

    expect(response.ok(), path).toBe(true);
    expect(response.headers()['content-type'], path).toContain(type);
  }
});

// The built index.html carries a Content-Security-Policy (vite.config.ts): the app must run under
// it, with no violation logged (a blocked inline script or style, font or request).
test('runs under its Content-Security-Policy', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  expect(violations).toEqual([]);
});

// A deep link reaches the app only when the host serves index.html for every path (`vite preview`,
// and Cloudflare Pages without a top-level 404.html); the app then shows its own not-found page.
test('shows the not-found page for an unknown URL', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Page not found')).toBeVisible();
});
