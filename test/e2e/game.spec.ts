import { test, expect } from './fixtures.ts';
import {
  GameStatusFactory,
  GameStatusRepository,
  ProposedProblemFactory,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { GameStatusUpdateService } from '~/game/services/game.server.ts';
import { GameStatus } from '~/game/models/game.ts';
import { UserRepository } from '~/accounts/lifecycle/user.server.ts';
import invariant from 'tiny-invariant';
import { prisma } from '~/db.server.ts';

test.describe('game cycle', () => {
  test('start with buy-ingredients with initial game state', async ({ loggedInPage }) => {
    await loggedInPage.goto('/play');
    await loggedInPage.getByRole('button', { name: /start game/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await expect(loggedInPage.getByText(/money: 1000/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 0/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot efficiency: 1/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot quality: 1/i)).toBeVisible();
  });
  test('buy ingredients', async ({ loggedInPage }) => {
    await loggedInPage.goto('/play');
    await loggedInPage.getByRole('button', { name: /start game/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await loggedInPage.getByLabel(/quantity/i).fill('9');
    await loggedInPage.getByRole('button', { name: /buy/i }).click();
    await expect(loggedInPage.getByText(/money: 100/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 9/i)).toBeVisible();
    await expect(
      loggedInPage.getByRole('heading', { name: /make and sell products/i }),
    ).toBeVisible();
  });
  test('buy ingredients with insufficient money', async ({ loggedInPage }) => {
    await loggedInPage.goto('/play');
    await loggedInPage.getByRole('button', { name: /start game/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await loggedInPage.getByLabel(/quantity/i).fill('11');
    await loggedInPage.getByRole('button', { name: /buy/i }).click();
    await expect(loggedInPage.getByText(/not enough money/i)).toBeVisible();
  });
  test('make and sell products', async ({ loggedInPage }) => {
    const gameStatus = GameStatusUpdateService.buyIngredients(
      GameStatusFactory.initialize(),
      'iron',
      9,
    );
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await GameStatusRepository.save(user.id, gameStatus);
    await TurnRepository.save(user.id, 'sell-products');

    await loggedInPage.goto('/play/router');
    await expect(
      loggedInPage.getByRole('heading', { name: /make and sell products/i }),
    ).toBeVisible();
    await expect(loggedInPage.getByText(/money: 100/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 9/i)).toBeVisible();

    await loggedInPage.getByLabel(/quantity/i).fill('1');
    await loggedInPage.getByRole('button', { name: /make items/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /solve problems/i })).toBeVisible();
    await expect(loggedInPage.getByText(/money: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
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
    const gameStatus = new GameStatus(500, new Map([['iron', 6]]), 1, 1);
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await GameStatusRepository.save(user.id, gameStatus);
    await TurnRepository.save(user.id, 'solve-problems');
    await prisma.problem.create({
      data: {
        id: 'abc070_a',
        title: 'A. Palindromic Number',
        difficulty: 100,
      },
    });
    const pp = await ProposedProblemFactory.createAndSave(user.id, {
      id: 'abc070_a',
      title: 'A. Palindromic Number',
      difficulty: 100,
    });
    await prisma.proposedProblem.update({
      where: { id: pp.id },
      data: { createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    });
    await loggedInPage.goto('/play/router');
    await expect(loggedInPage.getByRole('heading', { name: /solve problems/i })).toBeVisible();
    await expect(loggedInPage.getByText(/money: 500/i)).toBeVisible();
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
  //   const manufacturedGameStatus = GameStatusUpdateService.manufactureProducts(
  //     GameStatusUpdateService.buyIngredients(GameStatusFactory.initialize(), 'iron', 9),
  //     'sword',
  //     1,
  //   );
  //   const gameStatus = GameStatusUpdateService.sellProducts(
  //     manufacturedGameStatus.newStatus,
  //     new Map([['sword', 1]]),
  //   );
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
  //   const pp = await ProposedProblemFactory.createAndSave(user.id, {
  //     id: 'abc070_a',
  //     title: 'A. Palindromic Number',
  //     difficulty: 100,
  //   });
  //   await prisma.proposedProblem.update({
  //     where: { id: pp.id },
  //     data: { createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  //   });
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
  //   await expect(loggedInPage.getByText(/money: 500/i)).toBeVisible();
  //   await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
  //   await loggedInPage.getByRole('button', { name: /finish/i }).click();
  //   await expect(loggedInPage.getByRole('heading', { name: /get reward/i })).toBeVisible();
  //   await expect(loggedInPage.getByText(/cleared\?: true/i)).toBeVisible();
  // });
  test('get reward', async ({ loggedInPage }) => {
    const gameStatus = new GameStatus(500, new Map([['iron', 6]]), 1, 1);
    const user = await UserRepository.getByName('TestUser012');
    invariant(user, 'user not found');
    await GameStatusRepository.save(user.id, gameStatus);
    await TurnRepository.save(user.id, 'get-reward');
    await prisma.problem.create({
      data: {
        id: 'abc070_a',
        title: 'A. Palindromic Number',
        difficulty: 100,
      },
    });
    const pp = await ProposedProblemFactory.createAndSave(user.id, {
      id: 'abc070_a',
      title: 'A. Palindromic Number',
      difficulty: 100,
    });
    await prisma.proposedProblem.update({
      where: { id: pp.id },
      data: {
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        solvedAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
        finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
      },
    });
    await loggedInPage.goto('/play/router');
    await expect(loggedInPage.getByRole('heading', { name: /get reward/i })).toBeVisible();
    await expect(loggedInPage.getByText(/money: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot efficiency: 1/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot quality: 1/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: /show answer/i }).click();
    await loggedInPage.getByRole('button', { name: /get reward/i }).click();
    await expect(loggedInPage.getByRole('heading', { name: /buy ingredients/i })).toBeVisible();
    await expect(loggedInPage.getByText(/money: 500/i)).toBeVisible();
    await expect(loggedInPage.getByText(/iron: 6/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot efficiency: 5/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot quality: 5/i)).toBeVisible();
  });
});
