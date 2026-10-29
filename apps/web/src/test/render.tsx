import { Toaster } from '@repo/ui/components/sonner';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, parsePath, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { createRoutes } from '@/app/routes';

const renderRouter = (routes: RouteObject[], path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();

  const result = render(
    <>
      <RouterProvider router={router} />
      {/* As in AppProviders, so tests can assert toasts with findByText. */}
      <Toaster richColors />
    </>,
  );

  return { ...result, user, router };
};

/** Renders the real app route tree at `path`. Use for page-level tests. */
export const renderRoute = (path: string) => renderRouter(createRoutes(), path);

/** Renders one component inside the app's providers and a router (so `Link` works). */
export const renderWithProviders = (ui: ReactElement, { path = '/' } = {}) =>
  // A route matches the pathname only: `path` may also carry a query string or a hash.
  renderRouter([{ path: parsePath(path).pathname ?? '/', element: ui }], path);
