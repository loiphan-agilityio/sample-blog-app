import { screen } from '@testing-library/react';

import { renderRoute } from '@/test/render';

describe('HomePage (landing)', () => {
  it('renders the pitch, the features and one call to action at the top and the bottom', async () => {
    renderRoute('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: /people understand/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByRole('link', { name: /Get started/ })).toHaveAttribute(
      'href',
      '#get-started',
    );
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    );
  });

  it('opens a question to show its answer', async () => {
    const { user } = renderRoute('/');
    const question = await screen.findByText('Where does it deploy?');

    expect(screen.getByText(/Lighthouse on a Cloudflare Pages preview/)).not.toBeVisible();
    await user.click(question);
    expect(screen.getByText(/Lighthouse on a Cloudflare Pages preview/)).toBeVisible();
  });

  it('shows the not-found page for an unknown URL', async () => {
    renderRoute('/does-not-exist');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
