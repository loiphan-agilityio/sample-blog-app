import { screen } from '@testing-library/react';
import { useLocation } from 'react-router';

import { renderWithProviders } from '../render';

const Where = () => {
  const { pathname, search, hash } = useLocation();

  return <p>{`at ${pathname}${search}${hash}`}</p>;
};

describe('renderWithProviders', () => {
  it('renders the component at a path with a query string and a hash', () => {
    renderWithProviders(<Where />, { path: '/login?redirect=%2Ftasks#top' });
    expect(screen.getByText('at /login?redirect=%2Ftasks#top')).toBeInTheDocument();
  });
});
