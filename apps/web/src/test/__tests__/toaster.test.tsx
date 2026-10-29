import { act } from '@testing-library/react';
import { toast } from 'sonner';

import { renderWithProviders } from '../render';

describe('Toaster', () => {
  // The toast store is module-level: two sonner copies (app and @repo/ui) would silently show
  // nothing.
  it('shows a toast fired from the app through the @repo/ui Toaster', async () => {
    const { findByText } = renderWithProviders(<p>page</p>);

    act(() => {
      toast('Saved');
    });

    expect(await findByText('Saved')).toBeInTheDocument();
  });
});
