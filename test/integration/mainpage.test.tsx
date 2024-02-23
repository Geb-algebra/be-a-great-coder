import Page from '~/routes/play.tsx';
import { createRemixStub } from '@remix-run/testing';
import { render, screen, waitFor } from '@testing-library/react';

describe('mainpage', () => {
  it('should display username', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/',
        Component: Page,
        loader: async () => {
          return {
            user: { name: 'John Doe' },
            gameStatus: {
              money: 1000,
              ingredientStock: new Map([['iron', 5]]),
              robotEfficiency: 1,
              robotQuality: 1,
            },
          };
        },
      },
    ]);
    render(<RemixStub />);
    await waitFor(() => screen.findByText('John Doe'));
  });

  it('should display floating menu when user clicks on username', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/',
        Component: Page,
        loader: async () => {
          return {
            user: { name: 'John Doe' },
            gameStatus: {
              money: 1000,
              ingredientStock: new Map([['iron', 5]]),
              robotEfficiency: 1,
              robotQuality: 1,
            },
          };
        },
      },
    ]);
    render(<RemixStub />);
    const usernameButton = await screen.findByText('John Doe');
    usernameButton.click();
    await waitFor(() => screen.findByText('Settings'));
    await waitFor(() => screen.findByText('Log Out'));
  });
});