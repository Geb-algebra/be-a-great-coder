import { loader } from './play.buy-ingredients';
import { TurnRepository } from '~/game/lifecycle/game.server';
import {
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  setupAccountAndAuthenticatedRequest,
} from './test-utils';
import type { Account } from '~/accounts/models/account';

describe('loader', () => {
  let account: Account;
  let request: Request;
  beforeEach(async () => {
    const d = await setupAccountAndAuthenticatedRequest(
      'http://localhost:3000/play/buy-ingredients',
    );
    account = d.account;
    request = d.request;
    await TurnRepository.save(account.id, 'buy-ingredients');
  });
  it('should return the expected data for newcomers', async () => {
    await setInitialStatus(account.id);
    const response = await loader({ request, params: {}, context: {} });
    expect(response.status).toBe(200);
    expect(response.json()).resolves.toEqual({
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
    });
  });

  it('should return the expected data for beginners', async () => {
    await setBeginnersStatus(account.id);
    const response = await loader({ request, params: {}, context: {} });
    expect(response.status).toBe(200);
    expect(response.json()).resolves.toEqual({
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
    });
  });

  it('should return the expected data for veterans', async () => {
    await setVeteransStatus(account.id);
    const response = await loader({ request, params: {}, context: {} });
    expect(response.status).toBe(200);
    expect(response.json()).resolves.toEqual({
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
    });
  });
});
