const KEY = 'stale-chunk-reload-at';

/**
 * Handler for Vite's `vite:preloadError`: after a deploy, a tab still open on the previous release
 * asks for lazy chunks that are gone (Cloudflare Pages answers 404, see public/_headers), so the route cannot load. Reload
 * once to get the new index.html. A second failure within `windowMs` is left to the route's error
 * page, so a chunk that is really missing does not reload in a loop.
 */
export const reloadOnStaleChunk =
  ({
    storage = sessionStorage,
    reload = () => {
      window.location.reload();
    },
    now = Date.now,
    windowMs = 10_000,
  } = {}) =>
  (event: Event) => {
    if (now() - Number(storage.getItem(KEY) ?? 0) < windowMs) return;
    storage.setItem(KEY, String(now()));
    event.preventDefault();
    reload();
  };
