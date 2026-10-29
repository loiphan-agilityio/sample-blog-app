// The pure parts of tools/lighthouse.mjs: the minimum per category and how a Lighthouse report
// reads against them. Tested in tools/test/lighthouse.test.mjs; the CLI runs Lighthouse.

/** Accessibility and SEO fail the run; performance and best practices are noisy on a shared CI runner, so they only warn. */
export const categories = [
  { id: 'accessibility', min: 100, blocking: true },
  { id: 'seo', min: 95, blocking: true },
  { id: 'performance', min: 90, blocking: false },
  { id: 'best-practices', min: 90, blocking: false },
];

/**
 * Each category's score against its minimum, with the three audits that cost it the most points.
 * @param {{ categories: Record<string, { title: string, score: number, auditRefs: { id: string, weight: number }[] }>, audits: Record<string, { title: string, score: number | null }> }} report
 */
export const score = (report) =>
  categories.map(({ id, min, blocking }) => {
    const category = report.categories[id];
    const value = Math.round(category.score * 100);

    const failing = category.auditRefs
      .filter((ref) => ref.weight > 0 && (report.audits[ref.id]?.score ?? 1) < 1)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((ref) => report.audits[ref.id]?.title ?? ref.id);

    return { title: category.title, score: value, min, blocking, ok: value >= min, failing };
  });

/** @param {ReturnType<typeof score>} rows */
export const missed = (rows) => rows.filter((row) => row.blocking && !row.ok);

/**
 * @param {string} url
 * @param {ReturnType<typeof score>} rows
 */
export const toMarkdown = (url, rows) => {
  const below = missed(rows);

  return [
    `## Lighthouse (mobile): ${url}`,
    '',
    '| Category | Score | Minimum | Status | Top issues |',
    '|---|---|---|---|---|',
    ...rows.map((row) => {
      const status = row.ok ? 'pass' : row.blocking ? 'FAIL' : 'warn';

      return `| ${row.title} | ${row.score} | ${row.min}${row.blocking ? '' : ' (warn)'} | ${status} | ${row.failing.join('; ')} |`;
    }),
    '',
    below.length === 0
      ? 'Every blocking category meets its minimum.'
      : `Below the minimum: ${below.map((row) => row.title).join(', ')}.`,
    '',
  ].join('\n');
};
