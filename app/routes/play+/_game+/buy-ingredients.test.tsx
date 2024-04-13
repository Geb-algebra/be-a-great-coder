import { createRemixStub } from '@remix-run/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setInitialStatus, setBeginnersStatus, setVeteransStatus } from '~/routes/test/data.ts';
import Layout, { loader as layoutLoader } from './_layout.tsx';
import Page, { loader, action } from './buy-ingredients.tsx';
import { action as buyAction } from './buy-ingredients.$name.tsx';
import type { Account } from '~/accounts/models/account.ts';
import { TotalAssetsRepository, TurnRepository } from '~/game/lifecycle/game.server.ts';
import { TURNS, TotalAssets } from '~/game/models/game.ts';
import { setupAccount, authenticated } from '~/routes/test/utils.ts';

describe.each([
  ['newcomers', setInitialStatus, 0],
  ['beginners', setBeginnersStatus, 16],
  ['veterans', setVeteransStatus, 128],
])('Page for %s', (_, statusSetter, ironAmount) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, 'buy-ingredients');
  });
  it('render all ingredients and buy1, buy10 and finish buying buttons', async () => {
    await statusSetter(account.id);
    const RemixStub = createRemixStub([
      {
        path: '/play/buy-ingredients',
        loader: authenticated(loader),
        Component: Page,
      },
    ]);
    render(<RemixStub initialEntries={['/play/buy-ingredients']} />);
    await screen.findByRole('heading', { name: /buy ingredients/i });
    await screen.findByRole('heading', { name: /iron/i });
    await screen.findByRole('button', { name: /buy 1$/i });
    await screen.findByRole('button', { name: /buy 10$/i });
    await screen.findByRole('button', { name: /finish buying/i });
  });

  it.each([1, 10])(
    'increases the quantity of iron by %d when the button is clicked',
    async (quantity) => {
      await statusSetter(account.id);
      const RemixStub = createRemixStub([
        {
          path: '/play',
          loader: authenticated(layoutLoader),
          Component: Layout,
          children: [
            {
              path: '/play/buy-ingredients',
              Component: Page,
              loader: authenticated(loader),
              children: [
                {
                  path: '/play/buy-ingredients/iron',
                  action: (args) => authenticated(buyAction)({ ...args, params: { name: 'iron' } }),
                },
              ],
            },
          ],
        },
      ]);
      render(<RemixStub initialEntries={['/play/buy-ingredients']} />);
      await screen.findByText(RegExp(`iron: ${ironAmount}`, 'i'));
      const buy1Button = await screen.findByRole('button', {
        name: RegExp(`buy ${quantity}$`, 'i'),
      });
      const user = userEvent.setup();
      await user.click(buy1Button);
      await screen.findByText(RegExp(`iron: ${ironAmount + quantity}`, 'i'));
    },
  );

  it('display error if the user has not enough money', async () => {
    await statusSetter(account.id);
    const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
    const newAssets = new TotalAssets(0, totalAssets.battery, totalAssets.ingredientStock);
    await TotalAssetsRepository.save(account.id, newAssets);
    const RemixStub = createRemixStub([
      {
        path: '/play/buy-ingredients',
        loader: authenticated(loader),
        action: authenticated(action),
        Component: Page,
        children: [
          {
            path: '/play/buy-ingredients/iron',
            action: (args) => authenticated(buyAction)({ ...args, params: { name: 'iron' } }),
          },
        ],
      },
    ]);
    render(<RemixStub initialEntries={['/play/buy-ingredients']} />);
    await screen.findByRole('heading', { name: /buy ingredients/i });
    const buy1Button = await screen.findByRole('button', { name: /buy 1$/i });
    const user = userEvent.setup();
    await user.click(buy1Button);
    await screen.findByText(/not enough money/i);
  });

  it.each(TURNS.filter((v) => v !== 'buy-ingredients'))(
    'redirects to /play/router if the turn is %s',
    async (turn) => {
      await statusSetter(account.id);
      await TurnRepository.save(account.id, turn);
      const RemixStub = createRemixStub([
        {
          path: '/play/buy-ingredients',
          loader: authenticated(loader),
          Component: Page,
        },
        {
          path: '/play/router',
          Component: () => <div>Test Succeeded 😆</div>,
        },
      ]);
      render(<RemixStub initialEntries={['/play/buy-ingredients']} />);
      await screen.findByText(/test succeeded/i);
    },
  );

  it('redirects to /play/router after clicking the finish buying button', async () => {
    await statusSetter(account.id);
    const RemixStub = createRemixStub([
      {
        path: '/play/buy-ingredients',
        loader: authenticated(loader),
        action: authenticated(action),
        Component: Page,
      },
      {
        path: '/play/router',
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ]);
    render(<RemixStub initialEntries={['/play/buy-ingredients']} />);
    const finishButton = await screen.findByRole('button', { name: /finish buying/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
});
