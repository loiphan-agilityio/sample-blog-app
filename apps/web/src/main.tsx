import '@/styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AppProviders } from '@/app/providers';
import { createRoutes } from '@/app/routes';
import { reportRouteError } from '@/lib/report-error';
import { reloadOnStaleChunk } from '@/lib/stale-chunk';

// A lazy route whose chunk is gone after a deploy reloads the tab once (see stale-chunk.ts).
window.addEventListener('vite:preloadError', reloadOnStaleChunk());

const router = createBrowserRouter(createRoutes());
const root = document.getElementById('root');

if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} onError={reportRouteError} />
    </AppProviders>
  </StrictMode>,
);
