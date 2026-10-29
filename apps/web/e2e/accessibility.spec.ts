// axe (@axe-core/playwright) on each page: any WCAG 2.x A or AA violation it can detect fails the
// test with the rule and the elements. Automated rules find part of WCAG; the manual checks remain.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test('the home page has no detectable WCAG A or AA violation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(
    violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
  ).toEqual([]);
});
