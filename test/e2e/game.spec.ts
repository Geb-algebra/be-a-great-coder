import { test, expect } from './fixtures.ts';
import {
  TotalAssetsRepository,
  LaboratoryRepository,
  TurnRepository,
  ResearchFactory,
} from '~/game/lifecycle/game.server.ts';
import { TotalAssets } from '~/game/models/game.ts';
import { UserRepository } from '~/accounts/lifecycle/user.server.ts';
import invariant from 'tiny-invariant';
import { prisma } from '~/db.server.ts';

test.describe('game cycle', () => {
  test('start with buy-ingredients with initial game state', async ({ loggedInPage }) => {
    await loggedInPage.goto('/play');
    await loggedInPage.getByRole('button', { name: /start game/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 1000/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 0/i)).toBeVisible();
    await expect(loggedInPage.getByText(/battery capacity: 1/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot performance: 1/i)).toBeVisible();
  });
  test('buy ingredients', async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(1100, 1, new Map([['iron', 0]]));
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await TotalAssetsRepository.save(user.id, totalAssets);

    await loggedInPage.goto('/play');
    await loggedInPage.getByRole('button', { name: /start game/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await loggedInPage.getByRole('button', { name: /buy 1$/i }).click();
    await expect(loggedInPage.getByText(/cash: 1000/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 1/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /buy 10$/i }).click();
    await expect(loggedInPage.getByText(/cash: 0/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 11/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /buy 1$/i }).click();
    await expect(loggedInPage.getByText(/not enough money/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /finish buying/i }).click();
    await expect(
      loggedInPage.getByRole('heading', { name: /make and sell products/i }),
    ).toBeVisible();
  });
  test('make and sell products', async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(100, 2, new Map([['iron', 9]]));
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, 'sell-products');

    await loggedInPage.goto('/play/router');
    await expect(
      loggedInPage.getByRole('heading', { name: /make and sell products/i }),
    ).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 100/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 9/i)).toBeVisible();

    await loggedInPage.getByRole('button', { name: /make sword/i }).click();
    await expect(loggedInPage.getByText(/cash: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /make sword/i }).click();
    await expect(loggedInPage.getByText(/cash: 900/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 3/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /make sword/i }).click();
    await expect(loggedInPage.getByText(/battery is not enough/i)).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 900/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 3/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /finish making products/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /select problems/i })).toBeVisible();
  });
  test('select problems', async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(500, 6, new Map([['iron', 6]]));
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, 'select-problems');

    await loggedInPage.goto('/play/router');
    await expect(loggedInPage.getByRole('heading', { name: /select problems/i })).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await expect(loggedInPage.getByRole('button', { name: /100/i })).toBeVisible();
    await expect(loggedInPage.getByRole('button', { name: /200/i })).toBeVisible();
    await expect(loggedInPage.getByRole('button', { name: /300/i })).toBeVisible();
    await loggedInPage.getByRole('button', { name: /200/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /solve problems/i })).toBeVisible();
  });
  test('finish unsolved problems', async ({ loggedInPage }) => {
    // target problem:
    // {
    //   id: 'abc070_a',
    //   contest_id: 'abc070',
    //   problem_index: 'A',
    //   name: 'Palindromic Number',
    //   title: 'A. Palindromic Number',
    //   shortest_submission_id: 11334383,
    //   shortest_contest_id: 'abc070',
    //   shortest_user_id: 'LiEat_D',
    //   fastest_submission_id: 1503783,
    //   fastest_contest_id: 'abc070',
    //   fastest_user_id: 'kotatsugame',
    //   first_submission_id: 1503751,
    //   first_contest_id: 'abc070',
    //   first_user_id: 'ei13333',
    //   source_code_length: 15,
    //   execution_time: 0,
    //   point: 100.0,
    //   solver_count: 9848,
    // },
    const totalAssets = new TotalAssets(500, 6, new Map([['iron', 6]]));
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, 'solve-problems');
    await prisma.problem.create({
      data: {
        id: 'abc070_a',
        title: 'A. Palindromic Number',
        difficulty: 100,
      },
    });
    const research = await ResearchFactory.create(user.id, 'abc070_a');
    research.createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24);
    await LaboratoryRepository.addResearch(user.id, research);

    await loggedInPage.goto('/play/router');
    await expect(loggedInPage.getByRole('heading', { name: /solve problems/i })).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /finish/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /get reward/i })).toBeVisible();
    await expect(loggedInPage.getByText(/cleared\?: false/i)).toBeVisible();
  });
  // test('finish solved problems', async ({ loggedInPage }) => {
  //   // target problem:
  //   // {
  //   //   id: 'abc070_a',
  //   //   contest_id: 'abc070',
  //   //   problem_index: 'A',
  //   //   name: 'Palindromic Number',
  //   //   title: 'A. Palindromic Number',
  //   //   shortest_submission_id: 11334383,
  //   //   shortest_contest_id: 'abc070',
  //   //   shortest_user_id: 'LiEat_D',
  //   //   fastest_submission_id: 1503783,
  //   //   fastest_contest_id: 'abc070',
  //   //   fastest_user_id: 'kotatsugame',
  //   //   first_submission_id: 1503751,
  //   //   first_contest_id: 'abc070',
  //   //   first_user_id: 'ei13333',
  //   //   source_code_length: 15,
  //   //   execution_time: 0,
  //   //   point: 100.0,
  //   //   solver_count: 9848,
  //   // },
  //   const gameStatus = new GameStatus(500, new Map([['iron', 6]]), 1, 1);
  //   const user = await UserRepository.getByName('TestUser012');
  //   invariant(user, 'user not found');
  //   await GameStatusRepository.save(user.id, gameStatus);
  //   await TurnRepository.save(user.id, 'solve-problems');
  //   await prisma.problem.create({
  //     data: {
  //       id: 'abc070_a',
  //       title: 'A. Palindromic Number',
  //       difficulty: 100,
  //     },
  //   });
  //   const pp = await ProposedProblemFactory.create(user.id, {
  //     id: 'abc070_a',
  //     title: 'A. Palindromic Number',
  //     difficulty: 100,
  //   });
  //   pp.createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24);
  //   await ProposedProblemRepository.save(pp);
  //   // for some reason we can't override mock here
  //   server.use(
  //     http.get('https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions', () => {
  //       return new Response(
  //         JSON.stringify([
  //           {
  //             id: 5870139,
  //             epoch_second: Math.round(Date.now() / 1000),
  //             problem_id: 'abc070_a',
  //             contest_id: 'abc070',
  //             user_id: 'TestUser012',
  //             language: 'C# (Mono 4.6.2.0)',
  //             point: 100.0,
  //             length: 754,
  //             result: 'AC',
  //             execution_time: 143,
  //           },
  //         ]),
  //         { status: 200 },
  //       );
  //     }),
  //   );

  //   await loggedInPage.goto('/play/router');
  //   await expect(loggedInPage.getByRole('heading', { name: /solve problems/i })).toBeVisible();
  //   await expect(loggedInPage.getByText(/cash: 500/i)).toBeVisible();
  //   await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
  //   await loggedInPage.getByRole('button', { name: /finish/i }).click();
  //   await expect(loggedInPage.getByRole('heading', { name: /get reward/i })).toBeVisible();
  //   await expect(loggedInPage.getByText(/cleared\?: true/i)).toBeVisible();
  // });
  test('get reward', async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(500, 1, new Map([['iron', 6]]));
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, 'get-reward');
    await prisma.problem.create({
      data: {
        id: 'abc070_a',
        title: 'A. Palindromic Number',
        difficulty: 100,
      },
    });
    const research = await ResearchFactory.create(user.id, 'abc070_a');
    research.createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24);
    research.solvedAt = new Date(Date.now() - 1000 * 60 * 60 * 23);
    research.finishedAt = new Date(Date.now() - 1000 * 60 * 60 * 22);
    await LaboratoryRepository.addResearch(user.id, research);

    await loggedInPage.goto('/play/router');
    await expect(loggedInPage.getByRole('heading', { name: /get reward/i })).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await expect(loggedInPage.getByText(/battery capacity: 1/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot performance: 1/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /show answer/i }).click();
    await loggedInPage.getByRole('button', { name: /get reward/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await expect(loggedInPage.getByText(/cash: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await expect(loggedInPage.getByText(/battery capacity: 2/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot performance: 2/i)).toBeVisible();
  });
});
