import { createId } from "@paralleldrive/cuid2";
import { prisma } from "~/db.server";
import {
  LaboratoryRepository,
  TotalAssetsFactory,
  TotalAssetsRepository,
} from "~/game/lifecycle/game.server.ts";
import { INGREDIENTS, TotalAssets } from "~/game/models/game.ts";

/**
 * Save the initial status to the database.
 */
export async function setInitialStatus(userId: string) {
  const totalAssets = TotalAssetsFactory.initialize();
  await TotalAssetsRepository.save(userId, totalAssets);
  const laboratory = LaboratoryRepository.get(userId);
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
  const totalAssets = new TotalAssets(
    1200,
    3,
    new Map(INGREDIENTS.map((ingredient) => [ingredient.name, 16])),
  );
  await TotalAssetsRepository.save(userId, totalAssets);
  const laboratory = await LaboratoryRepository.get(userId);
  for (let i = 0; i < 3; i++) {
    const pid = `ATC10${i}`;
    const difficulty = 100;
    const problem = await prisma.problem.upsert({
      where: { id: pid },
      create: {
        id: pid,
        title: `Test problem ${i} ${difficulty}`,
        difficulty,
      },
      update: {
        id: pid,
        title: `Test problem ${i} ${difficulty}`,
        difficulty,
      },
    });
    await LaboratoryRepository.addResearch(userId, {
      id: createId(),
      problem,
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
  return { totalAssets, laboratory };
}

/**
 * Sets the veterans status to the database.
 *
 * 32768 cash, 136 battery, and 128 iron.
 *
 * 30 researches, difficulty 100 to 900, battery capacity increment 1 to 9, performance increment 1 to 9.
 *
 * The researches are solved, finished, the explanation is displayed, and the reward is received.
 */
export async function setVeteransStatus(userId: string) {
  const totalAssets = new TotalAssets(
    32768,
    136,
    new Map(INGREDIENTS.map((ingredient) => [ingredient.name, 128])),
  );
  await TotalAssetsRepository.save(userId, totalAssets);
  const laboratory = await LaboratoryRepository.get(userId);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 3; j++) {
      const pid = `ATC0${i}${j}`;
      const difficulty = (i + 1) * 100;
      const problem = await prisma.problem.upsert({
        where: { id: pid },
        create: {
          id: pid,
          title: `Test problem ${j} ${difficulty}`,
          difficulty,
        },
        update: {
          id: pid,
          title: `Test problem ${j} ${difficulty}`,
          difficulty,
        },
      });
      await LaboratoryRepository.addResearch(userId, {
        id: createId(),
        problem,
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
  return { totalAssets, laboratory };
}

export const initialJson = {
  totalAssetsJson: {
    cash: 1000,
    battery: 1,
    ingredientStock: [["Iron", 0]],
  },
  laboratoryValue: {
    batteryCapacity: 1,
    performance: 1,
    researcherRank: 0,
  },
};

export const beginnersJson = {
  totalAssetsJson: {
    cash: 1200,
    battery: 3,
    ingredientStock: [["Iron", 16]],
  },
  laboratoryValue: {
    batteryCapacity: 4,
    performance: 4,
    researcherRank: 100,
  },
};

export const veteransJson = {
  totalAssetsJson: {
    cash: 32768,
    battery: 136,
    ingredientStock: [["Iron", 128]],
  },
  laboratoryValue: {
    batteryCapacity: 136,
    performance: 136,
    researcherRank: (2 * 800 + 3 * 900) / 5,
  },
};
