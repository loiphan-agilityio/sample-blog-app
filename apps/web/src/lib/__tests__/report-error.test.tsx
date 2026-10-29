import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { createRoutes } from '@/app/routes';

import { reportRouteError } from '../report-error';

const Broken = () => {
  throw new Error('render failed');
};

/** The app's routes with one that throws, on a router wired like main.tsx's. */
const renderAt = (path: string) => {
  const routes = createRoutes();

  routes[0]?.children?.push({ path: 'broken', Component: Broken });

  render(
    <RouterProvider
      router={createMemoryRouter(routes, { initialEntries: [path] })}
      onError={reportRouteError}
    />,
  );
};

describe('reportRouteError', () => {
  it('reports a route that throws, once, with its pattern', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderAt('/broken');

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();

    const reports = consoleError.mock.calls.filter(([label]) => label === '[route /broken]');

    expect(reports).toHaveLength(1);
    expect(reports[0]?.[1]).toEqual(new Error('render failed'));
  });

  it('does not report a URL that matches no route', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderAt('/does-not-exist');

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
    expect(consoleError.mock.calls.filter(([label]) => String(label).startsWith('[route'))).toEqual(
      [],
    );
  });
});
