import { Toaster } from '@repo/ui/components/sonner';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

/** The providers a test gets (src/test/render.tsx): a router and the Toaster. */
export const StoryProviders = ({ children }: { readonly children: ReactNode }) => (
  <>
    <MemoryRouter>{children}</MemoryRouter>
    <Toaster richColors />
  </>
);
