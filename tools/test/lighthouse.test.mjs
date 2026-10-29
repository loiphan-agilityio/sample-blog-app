import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { missed, score, toMarkdown } from '../lib/lighthouse.mjs';

/** A Lighthouse report cut down to the fields score() reads, in Lighthouse 13's shape. */
const report = (scores) => ({
  categories: {
    accessibility: {
      title: 'Accessibility',
      score: scores.accessibility,
      auditRefs: [
        { id: 'color-contrast', weight: 7 },
        { id: 'image-alt', weight: 10 },
        { id: 'tabindex', weight: 0 },
        { id: 'label', weight: 7 },
        { id: 'link-name', weight: 7 },
      ],
    },
    seo: { title: 'SEO', score: scores.seo, auditRefs: [{ id: 'meta-description', weight: 1 }] },
    performance: {
      title: 'Performance',
      score: scores.performance,
      auditRefs: [{ id: 'largest-contentful-paint', weight: 25 }],
    },
    'best-practices': { title: 'Best Practices', score: scores.bestPractices, auditRefs: [] },
  },
  audits: {
    'color-contrast': { title: 'Contrast', score: 0 },
    'image-alt': { title: 'Image alt', score: 0 },
    tabindex: { title: 'Tabindex', score: 0 },
    label: { title: 'Labels', score: 1 },
    'link-name': { title: 'Link names', score: null },
    'meta-description': { title: 'Meta description', score: 1 },
    'largest-contentful-paint': { title: 'Largest Contentful Paint', score: 0.6 },
  },
});

describe('lighthouse', () => {
  it('passes when accessibility and SEO meet their minimum, whatever the others score', () => {
    const rows = score(
      report({ accessibility: 1, seo: 0.95, performance: 0.4, bestPractices: 0.8 }),
    );

    assert.deepEqual(missed(rows), []);
    assert.deepEqual(
      rows.map(({ score: value, ok }) => [value, ok]),
      [
        [100, true],
        [95, true],
        [40, false],
        [80, false],
      ],
    );
    assert.match(
      toMarkdown('https://x.test', rows),
      /\| Performance \| 40 \| 90 \(warn\) \| warn \|/,
    );
  });

  it('fails below a blocking minimum and names the audits that cost the most, heaviest first', () => {
    const rows = score(
      report({ accessibility: 0.93, seo: 0.94, performance: 1, bestPractices: 1 }),
    );

    assert.deepEqual(
      missed(rows).map(({ title }) => title),
      ['Accessibility', 'SEO'],
    );
    // Weight 0 (tabindex), a passed audit (label) and one without a score (link-name) cost nothing.
    assert.deepEqual(rows[0]?.failing, ['Image alt', 'Contrast']);
    assert.match(toMarkdown('https://x.test', rows), /Below the minimum: Accessibility, SEO\./);
  });
});
