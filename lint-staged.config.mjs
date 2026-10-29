// Checks run on staged files before each commit (husky pre-commit), from the repository root:
// Oxlint (oxlint.config.ts, type-aware) and Prettier, each skipping what its ignore list names.
const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

export default {
  '*.{js,mjs,ts,tsx}': (files) => [
    `oxlint --type-aware --deny-warnings --fix ${quote(files)}`,
    `prettier --write ${quote(files)}`,
  ],
  '*.{json,css,html,yml,yaml}': 'prettier --write',
};
