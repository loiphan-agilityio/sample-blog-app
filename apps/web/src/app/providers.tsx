import { Toaster } from '@repo/ui/components/sonner';
import type { ReactNode } from 'react';

/** App-wide providers. The router is rendered inside, so every route can use them. */
export const AppProviders = ({ children }: { readonly children: ReactNode }) => (
  <>
    {children}
    <Toaster richColors />
  </>
);
