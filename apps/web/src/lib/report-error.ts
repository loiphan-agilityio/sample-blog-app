import type { ClientOnErrorFunction } from 'react-router';

/** Where an error that reached `reportError` came from. */
interface ErrorContext {
  readonly source: 'route' | 'query' | 'mutation';
  /** The route pattern (`/items/:id`) or the query key, as text. */
  readonly where?: string;
}

/**
 * The one exit for an error the app did not expect: a route that threw, an API answer the app
 * cannot use (a 5xx, a body that breaks its schema). It writes to the console. To send errors to
 * a tracker (Sentry, Datadog, ...), call it here: every caller then reports there.
 */
export const reportError = (
  // The inbound boundary: a route can throw anything, and nothing here reads the value but the
  // console (or a tracker), so it stays unknown.
  // oxlint-disable-next-line anti-slop/no-unknown-parameters
  error: unknown,
  context: ErrorContext,
) => {
  console.error(`[${context.source}${context.where ? ` ${context.where}` : ''}]`, error);
};

/**
 * RouterProvider's `onError` (main.tsx): every error a route throws, once (RouteError may render
 * it more than once). React Router does not call it for a URL that matches no route.
 */
export const reportRouteError: ClientOnErrorFunction = (error, { pattern }) => {
  reportError(error, { source: 'route', where: pattern });
};
