import { addAuthenticationSessionTo, setupAccount } from '~/routes/test/utils.ts';
import { setVeteransStatus } from '~/routes/test/data.ts';
import { action } from './buy-ingredients.$name.tsx';
import type { Account } from '~/accounts/models/account';
import { TotalAssetsRepository, TurnRepository } from '~/game/lifecycle/game.server';

describe('action', () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, 'buy-ingredients');
  });
  it('should buy the specified numbers of iron', async () => {
    await setVeteransStatus(account.id);
    const formData = new FormData();
    formData.append('quantity', '128');
    const request = new Request('http://localhost:3000/play/buy-ingredients/iron', {
      method: 'POST',
      body: formData,
    });
    await addAuthenticationSessionTo(request);
    const response = await action({ request, params: { name: 'iron' }, context: {} });
    expect(response).toBeNull();
    const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
    expect(totalAssets.cash).toBe(32768 - 12800);
    expect(totalAssets.ingredientStock.get('iron')).toBe(128 + 128);
  });

  it('should throw an error if the user doesnt have enough money', async () => {
    await setVeteransStatus(account.id);
    const formData = new FormData();
    formData.append('quantity', '999999');
    const request = new Request('http://localhost:3000/play/buy-ingredients/iron', {
      method: 'POST',
      body: formData,
    });
    await addAuthenticationSessionTo(request);
    const response = await action({ request, params: { name: 'iron' }, context: {} });
    expect(response?.error.message).toBe('Not enough money');
  });
});
