import '@testing-library/jest-dom/vitest';

import { configure } from '@testing-library/react';
import { toast } from 'sonner';

// Lazy routes and coverage instrumentation slow a first load: the default 1s for findBy* / waitFor
// times out now and then on a page test, more so under `pnpm check` (see `maxWorkers` in
// vite.config.ts). A real failure still fails.
configure({ asyncUtilTimeout: 5000 });

// jsdom has no matchMedia; sonner's Toaster (mounted by src/test/render.tsx) reads it for the
// system theme.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// sonner keeps toasts in a module-level store; without this a toast from one test shows up in the
// next test's Toaster.
beforeEach(() => {
  toast.dismiss();
});
