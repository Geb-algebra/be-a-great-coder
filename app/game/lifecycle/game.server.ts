import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '~/db.server.ts';

import { Laboratory, TotalAssets, TURNS } from '../models/game.ts';
import type { User } from '~/accounts/models/account.ts';
import type { Problem, Research, Turn } from '../models/game.ts';
import invariant from 'tiny-invariant';
import { ObjectNotFoundError } from '~/errors.ts';
import { createId } from '@paralleldrive/cuid2';

export class TotalAssetsFactory {
  static initialize() {
    return new TotalAssets(1000, 1, new Map([['iron', 0]]));
  }
}

export class TotalAssetsRepository {
  static async getOrThrow(userId: User['id']) {
    try {
      const { cash, battery } = await prisma.assets.findUniqueOrThrow({ where: { userId } });
      const ingredientStock = await prisma.ingredientStock.findMany({ where: { userId } });
      return new TotalAssets(
        cash,
        battery,
        ingredientStock.reduce(
          (map, stock) => map.set(stock.ingredientName, stock.amount),
          new Map(),
        ),
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ObjectNotFoundError('TotalAssets not found');
      }
      throw error;
    }
  }

  static async save(userId: User['id'], totalAssets: TotalAssets) {
    await prisma.$transaction(async (prisma) => {
      await prisma.assets.upsert({
        where: { userId },
        update: { cash: totalAssets.cash, battery: totalAssets.battery },
        create: { userId, cash: totalAssets.cash, battery: totalAssets.battery },
      });
      const ingredientStock = Array.from(totalAssets.ingredientStock.entries()).map(
        ([ingredientName, amount]) => ({
          userId,
          ingredientName,
          amount,
        }),
      );
      await prisma.ingredientStock.deleteMany({ where: { userId } });
      await prisma.ingredientStock.createMany({ data: ingredientStock });
    });
  }
}

export class ResearchFactory {
  static async create(userId: User['id'], problem: Problem): Promise<Research> {
    const existingProblem = await prisma.problem.findUnique({ where: { id: problem.id } });
    if (!existingProblem) {
      throw new ObjectNotFoundError('Problem not found');
    }
    return {
      id: createId(),
      problem,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      solvedAt: null,
      finishedAt: null,
      explanationDisplayedAt: null,
      rewardReceivedAt: null,
      batteryCapacityIncrement: null,
      performanceIncrement: null,
    };
  }
}

export class LaboratoryRepository {
  static async get(userId: User['id']): Promise<Laboratory> {
    const researches = await prisma.research.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { createdAt: 'asc' },
    });
    return new Laboratory(researches);
  }

  static async save(userId: User['id'], laboratory: Laboratory) {
    await prisma.research.deleteMany({ where: { userId } });
    await prisma.research.createMany({
      data: laboratory.researches.map((research) => ({
        id: research.id,
        problemId: research.problem.id,
        userId,
        createdAt: research.createdAt,
        solvedAt: research.solvedAt,
        finishedAt: research.finishedAt,
        explanationDisplayedAt: research.explanationDisplayedAt,
        rewardReceivedAt: research.rewardReceivedAt,
        batteryCapacityIncrement: research.batteryCapacityIncrement,
        performanceIncrement: research.performanceIncrement,
      })),
    });
  }
}

export class TurnFactory {
  static initialize(): Turn {
    return 'buy-ingredients';
  }
}

export class TurnRepository {
  static async getOrThrow(userId: User['id']): Promise<Turn> {
    try {
      const turn = (await prisma.currentTurn.findUniqueOrThrow({ where: { userId } })).turn;
      invariant(turn && (TURNS as unknown as string[]).includes(turn), `Invalid turn: ${turn}`);
      return turn as Turn;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ObjectNotFoundError('Turn not found');
      }
      throw error;
    }
  }

  static async save(userId: User['id'], turn: Turn) {
    await prisma.currentTurn.upsert({
      where: { userId },
      update: { turn },
      create: { userId, turn },
    });
  }
}
