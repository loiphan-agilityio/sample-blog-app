import { Outlet } from 'react-router';

export const RootLayout = () => (
  <div className="flex min-h-svh flex-col bg-background text-foreground">
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur">
      <div
        aria-hidden
        className="h-px bg-linear-to-r from-brand-cyan via-primary to-brand-purple"
      />
    </header>
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <Outlet />
    </main>
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      Built with React, Vite and shadcn/ui.
    </footer>
  </div>
);
