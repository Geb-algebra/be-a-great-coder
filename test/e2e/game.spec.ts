import type { Page } from "@playwright/test";
import invariant from "tiny-invariant";
import { UserRepository } from "~/accounts/lifecycle/user.server.ts";
import { prisma } from "~/db.server.ts";
import {
  LaboratoryRepository,
  ResearchFactory,
  TotalAssetsRepository,
  TurnRepository,
} from "~/game/lifecycle/game.server.ts";
import { INGREDIENT_NAMES, type IngredientName, TotalAssets } from "~/game/models/game.ts";
import { expect, test } from "./fixtures.ts";

async function assertNumIngredients(page: Page, ingredientName: IngredientName, num: number) {
  await expect(
    page
      .getByRole("list", { name: /ingredient stock/i })
      .getByRole("listitem", { name: RegExp(`${ingredientName}`, "i") })
      .getByText(String(num)),
  ).toBeVisible();
}

test.describe("game cycle", () => {
  test("start with buy-ingredients with initial game state", async ({ loggedInPage }) => {
    await loggedInPage.goto("/play");
    await loggedInPage.getByRole("button", { name: /start game/i }).click();
    await expect(loggedInPage.getByRole("heading", { name: /buy ingredients/i })).toBeVisible();
    await expect(loggedInPage.getByText(/\$ 1000/i)).toBeVisible();

    for (const ingredientName of INGREDIENT_NAMES) {
      await assertNumIngredients(loggedInPage, ingredientName, 0);
    }
    await expect(loggedInPage.getByText(/battery: 1 \/ 1/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot performance: 1/i)).toBeVisible();
  });
  test("buy ingredients", async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(1100, 1, new Map([["Iron", 0]]));
    const user = await UserRepository.getByName("TestUser012");
    invariant(user, "user not found");
    await TotalAssetsRepository.save(user.id, totalAssets);

    await loggedInPage.goto("/play");
    await loggedInPage.getByRole("button", { name: /start game/i }).click();
    await expect(loggedInPage.getByRole("heading", { name: /buy ingredients/i })).toBeVisible();
    await loggedInPage
      .getByRole("list", { name: /buy ingredients/i })
      .getByRole("listitem", { name: /iron$/i })
      .getByRole("button", { name: /\+ 1$/i })
      .click();
    await expect(loggedInPage.getByText(/\$ 1000/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 1);
    await loggedInPage
      .getByRole("listitem", { name: /iron$/i })
      .getByRole("button", { name: /\+ 10$/i })
      .click();
    await expect(loggedInPage.getByText(/\$ 0/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 11);
    await loggedInPage
      .getByRole("listitem", { name: /iron$/i })
      .getByRole("button", { name: /\+ 1$/i })
      .click();
    await expect(loggedInPage.getByText(/not enough money/i)).toBeVisible();
    await loggedInPage.getByRole("button", { name: /finish buying/i }).click();
    await expect(
      loggedInPage.getByRole("heading", { name: /make and sell products/i }),
    ).toBeVisible();
  });
  test("make and sell products", async ({ loggedInPage }) => {
    // I set cash to 101, not 100, because the text "$ 100" hits twice in the page.
    const totalAssets = new TotalAssets(101, 2, new Map([["Iron", 9]]));
    const user = await UserRepository.getByName("TestUser012");
    invariant(user, "user not found");
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, "sell-products");

    await loggedInPage.goto("/play/router");
    await expect(
      loggedInPage.getByRole("heading", { name: /make and sell products/i }),
    ).toBeVisible();
    await expect(loggedInPage.getByText(/\$ 101/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 9);

    await loggedInPage
      .getByRole("listitem", { name: /sword$/i })
      .getByRole("button", { name: /make/i })
      .click();
    // TODO: test something about cash increase. currently we can't test it because it's random.
    // await expect(loggedInPage.getByText(/cash: 1100/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 6);
    await loggedInPage
      .getByRole("listitem", { name: /sword$/i })
      .getByRole("button", { name: /make/i })
      .click();
    // await expect(loggedInPage.getByText(/cash: 2100/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 3);
    await loggedInPage
      .getByRole("listitem", { name: /sword$/i })
      .getByRole("button", { name: /make/i })
      .click();
    await expect(loggedInPage.getByText(/not enough battery/i)).toBeVisible();
    // await expect(loggedInPage.getByText(/cash: 2100/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 3);
    await loggedInPage.getByRole("button", { name: /finish making products/i }).click();
    await expect(loggedInPage.getByRole("heading", { name: /select a problem/i })).toBeVisible();
  });
  test("select problems", async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(500, 6, new Map([["Iron", 6]]));
    const user = await UserRepository.getByName("TestUser012");
    invariant(user, "user not found");
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, "select-problems");

    await loggedInPage.goto("/play/router");
    await expect(loggedInPage.getByRole("heading", { name: /select a problem/i })).toBeVisible();
    await expect(loggedInPage.getByText(/\$ 500/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 6);
    await expect(loggedInPage.getByRole("button", { name: /difficulty: 100/i })).toBeVisible();
    await expect(loggedInPage.getByRole("button", { name: /difficulty: 200/i })).toBeVisible();
    await expect(loggedInPage.getByRole("button", { name: /difficulty: 300/i })).toBeVisible();
    await loggedInPage.getByRole("button", { name: /difficulty: 200/i }).click();
    await expect(loggedInPage.getByRole("heading", { name: /solve the problem/i })).toBeVisible();
  });
  test("finish unsolved problems", async ({ loggedInPage }) => {
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
    const totalAssets = new TotalAssets(500, 6, new Map([["Iron", 6]]));
    const user = await UserRepository.getByName("TestUser012");
    invariant(user, "user not found");
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, "solve-problems");
    await prisma.problem.create({
      data: {
        id: "abc070_a",
        title: "A. Palindromic Number",
        difficulty: 100,
      },
    });
    const research = await ResearchFactory.create(user.id, "abc070_a");
    research.createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24);
    research.startedAt = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const lab = await LaboratoryRepository.get(user.id);
    lab.researches.push(research);
    await LaboratoryRepository.forceSaveAllForTesting(user.id, lab);

    await loggedInPage.goto("/play/router");
    await expect(loggedInPage.getByRole("heading", { name: /solve the problem/i })).toBeVisible();
    await expect(loggedInPage.getByText(/\$ 500/i)).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 6);
    await loggedInPage.getByRole("button", { name: /finish/i }).click();
    await expect(loggedInPage.getByRole("heading", { name: /get reward/i })).toBeVisible();
    await expect(loggedInPage.getByText(/not solved yet/i)).toBeVisible();
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
  test("get reward", async ({ loggedInPage }) => {
    const totalAssets = new TotalAssets(500, 1, new Map([["Iron", 6]]));
    const user = await UserRepository.getByName("TestUser012");
    invariant(user, "user not found");
    await TotalAssetsRepository.save(user.id, totalAssets);
    await TurnRepository.save(user.id, "get-reward");
    await prisma.problem.create({
      data: {
        id: "abc070_a",
        title: "A. Palindromic Number",
        difficulty: 100,
      },
    });
    // const research = await ResearchFactory.create(user.id, "abc070_a");
    const research = {
      id: "abc070_a",
      problem: { id: "abc070_a", title: "A. Palindromic Number", difficulty: 100 },
      userId: user.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
      solvedAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
      answerShownAt: null,
      rewardReceivedAt: null,
      batteryCapacityIncrement: 1,
      performanceIncrement: 1,
    };
    const lab = await LaboratoryRepository.get(user.id);
    lab.researches.push(research);
    await LaboratoryRepository.forceSaveAllForTesting(user.id, lab);

    await loggedInPage.goto("/play/router");
    await expect(loggedInPage.getByRole("heading", { name: /get reward/i })).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 6);
    await expect(loggedInPage.getByText(/battery: 1 \/ 1/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot performance: 1/i)).toBeVisible();
    await loggedInPage.getByRole("button", { name: /read an answer/i }).click();
    await expect(loggedInPage.getByRole("button", { name: /answer has read/i })).toBeVisible();
    await loggedInPage.getByRole("button", { name: /get reward/i }).click();
    await expect(loggedInPage.getByRole("heading", { name: /buy ingredients/i })).toBeVisible();
    await assertNumIngredients(loggedInPage, "Iron", 6);
    await expect(loggedInPage.getByText(/battery: 2 \/ 2/i)).toBeVisible();
    await expect(loggedInPage.getByText(/robot performance: 2/i)).toBeVisible();
  });
});
