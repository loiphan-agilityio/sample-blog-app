# web

Landing page: one public marketing page on React 19, Vite 8, TypeScript 6 (strict), shadcn/ui
on Tailwind CSS 4 and React Router 8. Tests: Vitest 5, React Testing Library; end-to-end:
Playwright with axe. It calls no API: there is no API layer and no mocks. Deployed to
Cloudflare Pages (`public/_headers`) by the monorepo's CI/CD (`../../CLAUDE.md`). Package manager: pnpm. No SSR, no Next.js.

This app (package `web`) is part of a pnpm + Turborepo monorepo (see `../../CLAUDE.md`): run the
commands below from `apps/web`; the root `pnpm check` runs every package through turbo.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server. |
| `pnpm lint` | Oxlint (the root `oxlint.config.ts`, type-aware, `--deny-warnings`; also enforces the import rules below and anti-slop) and `prettier --check`. `pnpm lint:fix` fixes what it can and formats; run it before `pnpm check`. |
| `pnpm typecheck` | `tsc -b` |
| `pnpm test` | Vitest once, with coverage (≥ 80% lines in `src/features` and `src/lib`). `pnpm test:watch` to watch. |
| `pnpm test:e2e` | Playwright (`e2e/`, Chromium): builds the app (`pnpm build`: a landing page has no mocks) and serves it with `vite preview`; with `E2E_BASE_URL` set, tests that URL instead. `pnpm test:e2e:install` downloads Chromium once per machine. `pnpm test:e2e:report` builds the Allure 3 report of the last run (`allurerc.ts`, into `allure-report/`) and opens it. |
| `pnpm build` | Typecheck + production build: what CI tests and deploys. |
| `pnpm storybook` | Storybook on port 6006 (stories render inside `.storybook/story-providers.tsx`). |
| `pnpm build-storybook` | Static Storybook build; fails when a story does not compile. |
| `pnpm check` | All six gates: lint, typecheck, test, build, Storybook build, e2e. **Run before calling work done.** |

Run each command on its own, exactly as written (no pipes or redirects): the tool result already holds the output and the exit code.

## Layout

```
src/
  app/              home-page.tsx (the landing page), routes.tsx (createRoutes), providers.tsx,
                    root-layout.tsx, route-error.tsx
  components/       shared components, one folder per component, named like its export:
    Pricing/
      index.tsx                     the component itself (export const Pricing), not a re-export
      Pricing.stories.tsx
      __tests__/Pricing.test.tsx
  lib/
    report-error.ts   reportError(): the one exit for an unexpected error (console, or a tracker)
    stale-chunk.ts    reloadOnStaleChunk(): reloads a tab once when a chunk is gone after a deploy
  test/             setup.ts, render.tsx (renderRoute, renderWithProviders)
e2e/                Playwright specs: home.spec.ts, accessibility.spec.ts (axe)
playwright.config.ts  the e2e runner: production build + `vite preview`, or E2E_BASE_URL
allurerc.ts         the Allure 3 report of the e2e run (results in test-results/allure)
public/_headers     Cloudflare Pages headers; public/assets/404.html makes a missing chunk 404
```

The UI kit lives in `packages/ui` (`@repo/ui`): shadcn components in `packages/ui/src/components`
(import `@repo/ui/components/<name>`), `cn` in `packages/ui/src/lib/utils.ts` (import
`@repo/ui/lib/utils`), theme tokens in `packages/ui/src/styles/globals.css`. This app's
`src/styles/index.css` only imports it (`@import '@repo/ui/globals.css';`) and adds
`@source '..';`. Add a shadcn component with `pnpm exec shadcn add <name>`: run it in `apps/web`;
it writes into `packages/ui/src/components`. Never edit those files by hand.

## Code style

Lint enforces it, and `func-style` has no autofix, so write it this way from the start:

- Arrow functions only: `export const Pricing = () => { ... };`, `export const useX = () => ...`.
  A component that only returns markup
  returns it directly: `export const Page = () => (<section>...</section>);`.
- Destructure objects (`const { title } = item`, props, callback arguments), use shorthand
  properties, template literals instead of `+`, `??` / `?.`, `const` (never `var`), `===`.
- A handler that returns nothing gets braces: `onClick={() => { setOpen(true); }}`, not
  `onClick={() => setOpen(true)}` (`no-confusing-void-expression`).
- Inline type imports (`import { type Plan, plans } from './plans'`); `pnpm lint:fix`
  fixes most of the rest and formats.
- anti-slop (part of `pnpm lint`) rejects low-evidence code: a type assertion
  without a `// SAFETY:` comment on the invariant, `as unknown as`, `unknown` or `object` in a
  function's parameters or return type (parse at the boundary instead; a catch argument is named
  `cause`), `typeof` narrowing outside a parser, `vi.mock` of a module, comparing or building
  `_tag` by hand (use `instanceof` the error class, `Match`, or the class constructor). It also
  wants a blank line before a `return` and around multi-line statements: `pnpm lint:fix` adds them.

## A page without an API

- **This page calls no backend.** For data, sign-in or a form that posts, start a web app
  (`--app`) rather than adding an API layer here. Lint still rejects `fetch`,
  `XMLHttpRequest` and `axios` in app code.
- **Unexpected errors are reported in one place:** RouterProvider's `onError`
  (`reportRouteError`) reports a route that throws through `reportError`, in
  `src/lib/report-error.ts`.
- **Routes are factories** (`createRoutes()`): React Router mutates route objects when a lazy
  route loads, so each router needs fresh ones.

## Testing

- `renderRoute('/path')` renders the real route tree; `renderWithProviders(<X />)` renders one
  component. Both return `{ user, router, ...rtl }`; use `user` (user-event).
  Both mount the `Toaster`, so a toast is asserted as text (`findByText`); do not mock `sonner`.
  `src/test/__tests__/toaster.test.tsx` guards that the app's `toast()` and the `<Toaster>` from
  `@repo/ui` share one sonner instance.
- Tests live in a `__tests__/` folder next to the code they test, never beside the file itself
  (`components/Pricing/index.tsx` → `components/Pricing/__tests__/Pricing.test.tsx`). Every
  component has a unit test file there that renders it alone with `renderWithProviders(<X />)`.
  The page test (`renderRoute`) covers how the sections work together.
- Query by role and label, not test ids: one `h1`, headings in order, every link and button
  named.
- After a navigation to a lazy route, wait for the new page (`findBy*`) before asserting:
  until the route loads, the old page is still on screen.

## End-to-end tests

- Playwright specs live in `e2e/`: `home.spec.ts` walks the page as a visitor does (icons,
  manifest, the Content-Security-Policy, the not-found page) and `accessibility.spec.ts`
  runs axe for WCAG A and AA. A new section or page adds its flow to them.
- Query by role and label (`page.getByRole`, `page.getByLabel`) and assert with web-first
  `await expect(locator).toBeVisible()`; never `waitForTimeout`.
- The same specs run in CI against the live Cloudflare Pages site (`E2E_BASE_URL`), after the
  production deploy, so a spec never assumes localhost or a port.

## Stories

- Every component has a `<Name>.stories.tsx` in its folder (`components/ItemForm/index.tsx` →
  `components/ItemForm/ItemForm.stories.tsx`), with one story per variant it renders.
- The preview (`.storybook/preview.tsx`) wraps every story in the same providers as a test: add no
  providers in a story.

## Commits

- Messages follow Conventional Commits: `type(scope): summary` (`feat`, `fix`, `docs`, `refactor`,
  `test`, `chore`...). The `commit-msg` hook rejects anything else (commitlint).
- The `pre-commit` hook runs Oxlint and Prettier on the staged files (lint-staged), then
  `pnpm typecheck`. Fix what it reports; never commit with `--no-verify`.
- The hooks are installed by husky, the root `prepare` script, which `pnpm install` runs inside a git
  repository. After a `git init` in a project already installed, run `pnpm run prepare` to turn them
  on: `pnpm install` finds nothing to do and skips it.
- `.gitattributes` keeps every file LF, so a checkout with `core.autocrlf=true` still passes Prettier.

## Library versions newer than most training data

These APIs changed recently and are easy to recall wrong. Lint catches some; the rest compile
fine and fail at runtime.

- **React Router 8:** there is no `react-router-dom`. Import from `react-router`, and
  `RouterProvider` from `react-router/dom`.
- **Tailwind 4:** CSS-first. Theme tokens live in `packages/ui/src/styles/globals.css`
  (`@theme inline`), shared by every app; a token only this app uses goes in
  `src/styles/index.css` after the `@import`. There is still no `tailwind.config.js`. Use tokens
  (`bg-background`, `text-muted-foreground`), not raw colors.
- **Vitest 5:** `clearMocks` is on by default; `vi.mock` must be at the top level of a file; never
  `jest.*`.
- **Storybook 10:** `Meta` / `StoryObj` from `@storybook/react-vite`; `@storybook/test` is gone
  (`play` gets `canvas` and `userEvent` from its context).
- **TypeScript 6:** `baseUrl` is deprecated; `paths` works without it.

## Skills

Skills (the `web-dev` plugin, or its `skills/`, `references/`, `scripts/` and `agents/` copied
into `.claude/` or `~/.claude/`). They run in this folder (`apps/web`) and refuse the monorepo
root (see `../../CLAUDE.md`). They treat this page as tier `template` (variant `landing`) while
`src/test/render.tsx` exists and its `package.json` keeps `react`, `vite`, `@repo/ui` and
`packageManager`.

**Paths: this file wins over the skills.** Their references were written for a single-package
app. Where they name `@/components/ui/<x>`, `src/components/ui/`, `cn` from `@/lib/utils`, or
tokens in `src/styles/index.css`, use `@repo/ui/components/<x>`, `packages/ui/src/components/`,
`@repo/ui/lib/utils` and `packages/ui/src/styles/globals.css`.

- `develop` — the entry point (`/web-dev:develop <request>`): detects the project and routes a
  design or copy change to `ui-development`. A feature, endpoint or sign-in needs an API layer
  this page does not have: it says so and offers a new web app.
- `ui-development` — a design (screenshot, mockup, Figma, DESIGN.md; asks once if none) → a UI
  that matches it: tokens, shadcn components, tests, visual check.

Companion skills (installed by the web-dev plugin's `install-companions.sh`): `shadcn`, `react-router-data-mode`,
`vite`, `vitest`, `vercel-react-best-practices`, `vercel-composition-patterns`,
`react-hook-form`, `react-testing`.

**Priority when they disagree:** this file and the project skills, then the installed type
definitions, then companion skills. Companions are generic: ignore their Next.js / SSR / RSC
advice, Jest, `react-router-dom`, raw `fetch` examples and loader-first data fetching.
