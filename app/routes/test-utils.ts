import { createId } from '@paralleldrive/cuid2';
import { AccountFactory, AccountRepository } from '~/accounts/lifecycle/account.server';
import { queryRandomProblemByDifficulty } from '~/atcoder-info/models/problem.server';
import {
  LaboratoryRepository,
  TotalAssetsFactory,
  TotalAssetsRepository,
} from '~/game/lifecycle/game.server';
import { Laboratory, TotalAssets } from '~/game/models/game';
import { getSession, sessionStorage } from '~/services/session.server';

/**
 * Sets up an account and add a session to the request.
 *
 * ! This function mutates the given request instance.
 */
export async function setupAccountAndAuthenticatedRequest(url: string) {
  const account = await AccountFactory.create({
    name: 'testuser',
    id: 'testid',
  });
  await AccountRepository.save(account);
  const session = await getSession(new Request(url));
  session.set('user', { id: 'testid', name: 'testuser' });
  const request = new Request(url, {
    headers: { cookie: await sessionStorage.commitSession(session) },
  });
  return { account, request };
}

/**
 * Save the initial status to the database.
 */
export async function setInitialStatus(userId: string) {
  const totalAssets = TotalAssetsFactory.initialize();
  await TotalAssetsRepository.save(userId, totalAssets);
  const laboratory = new Laboratory([]);
  await LaboratoryRepository.save(userId, laboratory);
  return { totalAssets, laboratory };
}

/**
 * Sets the beginners status to the database.
 *
 * 1200 cash, 3 battery, and 16 iron.
 *
 * 3 researches, difficulty 100, battery capacity increment 1, performance increment 1.
 *
 * The researches are solved, finished, the explanation is displayed, and the reward is received.
 */
export async function setBeginnersStatus(userId: string) {
  const totalAssets = new TotalAssets(1200, 3, new Map([['iron', 16]]));
  await TotalAssetsRepository.save(userId, totalAssets);
  const researches = [];
  for (let i = 0; i < 3; i++) {
    const problem = await queryRandomProblemByDifficulty(100, 101);
    console.log(problem);
    researches.push({
      id: createId(),
      problem: problem,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      solvedAt: new Date(),
      finishedAt: new Date(),
      answerShownAt: new Date(),
      rewardReceivedAt: new Date(),
      batteryCapacityIncrement: 1,
      performanceIncrement: 1,
    });
  }
  const laboratory = new Laboratory(researches);
  await LaboratoryRepository.save(userId, laboratory);
  return { totalAssets, laboratory };
}

/**
 * Sets the veterans status to the database.
 *
 * 32768 cash, 165 battery, and 128 iron.
 *
 * 30 researches, difficulty 100 to 1000, battery capacity increment 1 to 10, performance increment 1 to 10.
 *
 * The researches are solved, finished, the explanation is displayed, and the reward is received.
 */
export async function setVeteransStatus(userId: string) {
  const totalAssets = new TotalAssets(32768, 136, new Map([['iron', 128]]));
  await TotalAssetsRepository.save(userId, totalAssets);
  const researches = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 3; j++) {
      const problem = await queryRandomProblemByDifficulty(100 * (i + 1), 100 * (i + 1) + 1);
      researches.push({
        id: createId(),
        problem: problem,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: i + 1,
        performanceIncrement: i + 1,
      });
    }
  }
  const laboratory = new Laboratory(researches);
  await LaboratoryRepository.save(userId, laboratory);
  return { totalAssets, laboratory };
}
