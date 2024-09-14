import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "~/db.server.ts";

import { createId } from "@paralleldrive/cuid2";
import invariant from "tiny-invariant";
import type { User } from "~/accounts/models/account.ts";
import { GameLogicViolated, ObjectNotFoundError } from "~/errors.ts";
import { Laboratory, TURNS, TotalAssets } from "../models";
import type { Problem, Research, Turn } from "../models/game.ts";
import { INGREDIENTS, calcRobotExp } from "../services/config.ts";

function getEmptyIngredientStock() {
  return new Map([...INGREDIENTS.keys()].map((id) => [id, 0]));
}

export class TotalAssetsFactory {
  static initialize() {
    return new TotalAssets(1000, 1, getEmptyIngredientStock());
  }
}

export class TotalAssetsRepository {
  static async getOrThrow(userId: User["id"]) {
    try {
      const { cash, battery } = await prisma.assets.findUniqueOrThrow({ where: { userId } });
      const ingredientStock = await prisma.ingredientStock.findMany({ where: { userId } });
      return new TotalAssets(
        cash,
        battery,
        ingredientStock.reduce((map, stock) => {
          if (!INGREDIENTS.has(stock.ingredientId)) {
            throw new Error(`Invalid ingredient ID: ${stock.ingredientId}`);
          }
          return map.set(stock.ingredientId, stock.amount);
        }, getEmptyIngredientStock()),
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ObjectNotFoundError("TotalAssets not found");
      }
      throw error;
    }
  }

  static async save(userId: User["id"], totalAssets: TotalAssets) {
    await prisma.$transaction(async (prisma) => {
      await prisma.assets.upsert({
        where: { userId },
        update: { cash: totalAssets.cash, battery: totalAssets.battery },
        create: {
          user: { connect: { id: userId } },
          cash: totalAssets.cash,
          battery: totalAssets.battery,
        },
      });
      const ingredientStock = Array.from(totalAssets.ingredientStock.entries()).map(
        ([ingredientId, amount]) => ({
          user: { connect: { id: userId } },
          ingredientId,
          amount,
        }),
      );
      if (ingredientStock.length !== 0) {
        await prisma.ingredientStock.deleteMany({ where: { userId } });
        for (const ingredient of ingredientStock) {
          if (ingredient.amount !== 0) {
            await prisma.ingredientStock.create({ data: ingredient });
          }
        }
      }
    });
  }
}

export class ResearchFactory {
  static async create(userId: User["id"], problemId: Problem["id"]): Promise<Research> {
    const existingProblem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!existingProblem) {
      throw new ObjectNotFoundError("Problem not found");
    }
    return {
      id: createId(),
      problem: existingProblem,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      submittedAt: null,
      solvedAt: null,
      finishedAt: null,
      answerShownAt: null,
      rewardReceivedAt: null,
      batteryCapacityExp: calcRobotExp(existingProblem.difficulty),
      performanceExp: calcRobotExp(existingProblem.difficulty),
    };
  }
}

export class LaboratoryRepository {
  static async get(userId: User["id"]): Promise<Laboratory> {
    const researches = await prisma.research.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { createdAt: "asc" },
    });
    return new Laboratory(researches);
  }

  /**
   * Save all unrewarded research inserts and updates in laboratory
   *
   * this method has some restrictions to avoid updates of rewarded researches and reduce queries
   * specifically, it
   * - inserts new (included in the given laboratory but the not in the DB) unrewarded researches
   * - updates existing unrewarded researches (included both in the given laboratory and the DB)
   * - deletes unstarted researches that are not included in the given laboratory but in the DB
   *
   * in other words, it does NOT
   * - update rewarded researches (rewardReceivedAt is not null in database)
   * - insert rewarded researches (rewardReceivedAt is not null in laboratory)
   * - delete started researches
   */
  static async save(userId: User["id"], laboratory: Laboratory) {
    await prisma.$transaction(async (prisma) => {
      const savedUnrewardedResearches = await prisma.research.findMany({
        where: { userId, rewardReceivedAt: null },
      });
      const savedUnrewardedResearchesMap = new Map(
        savedUnrewardedResearches.map((research) => [research.id, research]),
      );
      for (const research of laboratory.researches) {
        const savedResearch = savedUnrewardedResearchesMap.get(research.id);

        if (savedResearch) {
          await prisma.research.update({
            where: { id: research.id },
            data: {
              startedAt: research.startedAt,
              submittedAt: research.submittedAt,
              solvedAt: research.solvedAt,
              finishedAt: research.finishedAt,
              answerShownAt: research.answerShownAt,
              rewardReceivedAt: research.rewardReceivedAt,
            },
          });
        } else {
          if (research.rewardReceivedAt !== null) {
            continue; // regard as a research that has alread been saved in DB and rewarded
          }
          await prisma.research.create({
            data: {
              id: research.id,
              problem: { connect: { id: research.problem.id } },
              user: { connect: { id: userId } },
              createdAt: research.createdAt,
              startedAt: research.startedAt,
              submittedAt: research.submittedAt,
              solvedAt: research.solvedAt,
              finishedAt: research.finishedAt,
              answerShownAt: research.answerShownAt,
              rewardReceivedAt: research.rewardReceivedAt,
              batteryCapacityExp: research.batteryCapacityExp,
              performanceExp: research.performanceExp,
            },
          });
        }
      }
      for (const savedResearch of savedUnrewardedResearches) {
        if (!laboratory.researches.some((research) => research.id === savedResearch.id)) {
          if (savedResearch.startedAt !== null) {
            throw new GameLogicViolated("Cannot delete started research");
          }
          await prisma.research.delete({ where: { id: savedResearch.id } });
        }
      }
    });
  }

  static async forceSaveAllForTesting(userId: User["id"], laboratory: Laboratory) {
    await prisma.$transaction(async (prisma) => {
      await prisma.research.deleteMany({ where: { userId } });
      for (const research of laboratory.researches) {
        await prisma.research.create({
          data: {
            id: research.id,
            problem: { connect: { id: research.problem.id } },
            user: { connect: { id: userId } },
            createdAt: research.createdAt,
            startedAt: research.startedAt,
            submittedAt: research.submittedAt,
            solvedAt: research.solvedAt,
            finishedAt: research.finishedAt,
            answerShownAt: research.answerShownAt,
            rewardReceivedAt: research.rewardReceivedAt,
            batteryCapacityExp: research.batteryCapacityExp,
            performanceExp: research.performanceExp,
          },
        });
      }
    });
  }
}

export class TurnFactory {
  static initialize(): Turn {
    return "buy-ingredients";
  }
}

export class TurnRepository {
  static async getOrThrow(userId: User["id"]): Promise<Turn> {
    try {
      const turn = (await prisma.currentTurn.findUniqueOrThrow({ where: { userId } })).turn;
      invariant(turn && (TURNS as unknown as string[]).includes(turn), `Invalid turn: ${turn}`);
      return turn as Turn;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ObjectNotFoundError("Turn not found");
      }
      throw error;
    }
  }

  static async save(userId: User["id"], turn: Turn) {
    await prisma.currentTurn.upsert({
      where: { userId },
      update: { turn },
      create: { userId, turn },
    });
  }
}
