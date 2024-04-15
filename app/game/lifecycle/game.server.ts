import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { prisma } from "~/db.server.ts";

import { createId } from "@paralleldrive/cuid2";
import invariant from "tiny-invariant";
import type { User } from "~/accounts/models/account.ts";
import { ObjectNotFoundError } from "~/errors.ts";
import { INGREDIENTS, Laboratory, TURNS, TotalAssets, isIngredientName } from "../models/game.ts";
import type { Problem, Research, Turn } from "../models/game.ts";

function getEmptyIngredientStock() {
  return new Map(INGREDIENTS.map((ingredient) => [ingredient.name, 0]));
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
          if (!isIngredientName(stock.ingredientName)) {
            throw new Error(`Invalid ingredient name: ${stock.ingredientName}`);
          }
          return map.set(stock.ingredientName, stock.amount);
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
        ([ingredientName, amount]) => ({
          user: { connect: { id: userId } },
          ingredientName,
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
      solvedAt: null,
      finishedAt: null,
      answerShownAt: null,
      rewardReceivedAt: null,
      batteryCapacityIncrement: null,
      performanceIncrement: null,
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

  static async addResearch(userId: User["id"], research: Research) {
    await prisma.research.create({
      data: {
        id: research.id,
        problem: { connect: { id: research.problem.id } },
        user: { connect: { id: userId } },
        createdAt: research.createdAt,
        solvedAt: research.solvedAt,
        finishedAt: research.finishedAt,
        answerShownAt: research.answerShownAt,
        rewardReceivedAt: research.rewardReceivedAt,
        batteryCapacityIncrement: research.batteryCapacityIncrement,
        performanceIncrement: research.performanceIncrement,
      },
    });
  }

  static async updateUnrewardedResearch(userId: User["id"], laboratory: Laboratory) {
    const d = await prisma.research.findMany({
      where: { userId, rewardReceivedAt: null },
    });
    if (!d) {
      throw new ObjectNotFoundError("Saved unrewarded research not found");
    }
    if (d.length !== 1) {
      throw new Error("Multiple unrewarded researches found");
    }
    const savedUnrewardedResearch = d[0];
    const updatedResearch = laboratory.researches.find(
      (research) => research.id === savedUnrewardedResearch.id,
    );
    if (!updatedResearch) {
      throw new ObjectNotFoundError(
        `Research ${savedUnrewardedResearch.id} not found in laboratory`,
      );
    }
    await prisma.research.update({
      where: { id: updatedResearch.id },
      data: {
        solvedAt: updatedResearch.solvedAt,
        finishedAt: updatedResearch.finishedAt,
        answerShownAt: updatedResearch.answerShownAt,
        rewardReceivedAt: updatedResearch.rewardReceivedAt,
        batteryCapacityIncrement: updatedResearch.batteryCapacityIncrement,
        performanceIncrement: updatedResearch.performanceIncrement,
      },
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
