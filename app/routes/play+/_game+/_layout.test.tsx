import { createRemixStub } from '@remix-run/testing';
import { render, screen } from '@testing-library/react';
import Page, { loader } from './_layout';
import { TurnRepository } from '~/game/lifecycle/game.server';
import {
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  setupAccountAndAuthenticatedRequest,
} from '../../test-utils';
import type { Account } from '~/accounts/models/account';

const initialJson = {
  totalAssetsJson: {
    cash: 1000,
    battery: 1,
    ingredientStock: [['iron', 0]],
  },
  laboratoryValue: {
    batteryCapacity: 1,
    performance: 1,
    researcherRank: 0,
  },
};

const beginnersJson = {
  totalAssetsJson: {
    cash: 1200,
    battery: 3,
    ingredientStock: [['iron', 16]],
  },
  laboratoryValue: {
    batteryCapacity: 4,
    performance: 4,
    researcherRank: 100,
  },
};

const veteransJson = {
  totalAssetsJson: {
    cash: 32768,
    battery: 136,
    ingredientStock: [['iron', 128]],
  },
  laboratoryValue: {
    batteryCapacity: 136,
    performance: 136,
    researcherRank: (2 * 800 + 3 * 900) / 5,
  },
};

describe('Page', () => {
  let account: Account;
  let request: Request;
  beforeEach(async () => {
    const d = await setupAccountAndAuthenticatedRequest('http://localhost:3000/play');
    account = d.account;
    request = d.request;
    await TurnRepository.save(account.id, 'buy-ingredients');
  });
  it.each([
    ['newcomers', setInitialStatus, initialJson],
    ['beginners', setBeginnersStatus, beginnersJson],
    ['veterans', setVeteransStatus, veteransJson],
  ])('should return the expected data for %s', async (_, setter, expected) => {
    await setter(account.id);
    const RemixStub = createRemixStub([
      {
        path: '',
        loader() {
          return loader({ request, params: {}, context: {} });
        },
        Component: Page,
      },
    ]);
    render(<RemixStub />);
    expect(
      await screen.findByText(
        RegExp(`researcher's rank: ${expected.laboratoryValue.researcherRank}`, 'i'),
      ),
    );
    expect(await screen.findByText(RegExp(`cash: ${expected.totalAssetsJson.cash}`, 'i')));
    expect(
      await screen.findByText(
        RegExp(`iron: ${expected.totalAssetsJson.ingredientStock[0][1]}`, 'i'),
      ),
    );
    expect(
      await screen.findByText(
        RegExp(
          `battery capacity: ${expected.totalAssetsJson.battery} / ${expected.laboratoryValue.batteryCapacity}`,
          'i',
        ),
      ),
    );
    expect(
      await screen.findByText(
        RegExp(`robot performance: ${expected.laboratoryValue.performance}`, 'i'),
      ),
    );
  });
});
