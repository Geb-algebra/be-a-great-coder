import type { User, ProposedProblem, Problem } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '~/db.server.ts';

import { GameStatus, TURNS, type Turn } from '../models/game.ts';
import invariant from 'tiny-invariant';
import { ObjectNotFoundError } from '~/errors.ts';

export class GameStatusFactory {
  static initialize(userId: User['id']) {
    return new GameStatus(1000, new Map(), 1, 1);
  }
}

export class GameStatusRepository {
  static async getOrThrow(userId: User['id']) {
    try {
      const robot = await prisma.robot.findUniqueOrThrow({ where: { userId } });
      const money = await prisma.money.findUniqueOrThrow({ where: { userId } });
      const ingredientStock = await prisma.ingredientStock.findMany({ where: { userId } });
      return new GameStatus(
        money.amount,
        ingredientStock.reduce(
          (map, stock) => map.set(stock.ingredientName, stock.amount),
          new Map(),
        ),
        robot.efficiencyLevel,
        robot.qualityLevel,
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ObjectNotFoundError('GameStatus not found');
      }
      throw error;
    }
  }

  static async save(userId: User['id'], gameStatus: GameStatus) {
    await prisma.money.upsert({
      where: { userId },
      update: { amount: gameStatus.money },
      create: { userId, amount: gameStatus.money },
    });
    const ingredientStock = Array.from(gameStatus.ingredientStock.entries()).map(
      ([ingredientName, amount]) => ({
        userId,
        ingredientName,
        amount,
      }),
    );
    await prisma.ingredientStock.deleteMany({ where: { userId } });
    await prisma.ingredientStock.createMany({ data: ingredientStock });
    await prisma.robot.upsert({
      where: { userId },
      update: {
        efficiencyLevel: gameStatus.robotEfficiency,
        qualityLevel: gameStatus.robotQuality,
      },
      create: {
        userId,
        efficiencyLevel: gameStatus.robotEfficiency,
        qualityLevel: gameStatus.robotQuality,
      },
    });
  }
}

export class ProposedProblemFactory {
  static async createAndSave(userId: User['id'], problem: Problem) {
    return await prisma.proposedProblem.create({
      data: {
        userId,
        problemId: problem.id,
      },
      include: { problem: true },
    });
  }
}

export class ProposedProblemRepository {
  static async get(userId: User['id']) {
    return await prisma.proposedProblem.findMany({
      where: { userId },
      include: { problem: true },
    });
  }

  static async getUnfinished(userId: User['id']) {
    return await prisma.proposedProblem.findFirst({
      where: { userId, finishedAt: null },
      include: { problem: true },
    });
  }

  static async getRewardUnreceived(userId: User['id']) {
    return await prisma.proposedProblem.findFirst({
      where: { userId, finishedAt: { not: null }, rewardReceivedAt: null },
      include: { problem: true },
    });
  }

  /**
   * Save a proposed problem
   *
   * only `finishedAt` and `explanationDisplayedAt` can be updated
   */
  static async save(proposedProblem: ProposedProblem) {
    const current = await prisma.proposedProblem.findUnique({ where: { id: proposedProblem.id } });
    if (!current) {
      await prisma.proposedProblem.create({ data: proposedProblem });
    } else {
      if (proposedProblem.problemId !== current.problemId) {
        throw new Error('problemId cannot be changed');
      }
      if (proposedProblem.userId !== current.userId) {
        throw new Error('userId cannot be changed');
      }
      if (proposedProblem.createdAt.getTime() !== current.createdAt.getTime()) {
        throw new Error('createdAt cannot be changed');
      }
      await prisma.proposedProblem.update({
        where: { id: proposedProblem.id },
        data: {
          solvedAt: proposedProblem.solvedAt,
          finishedAt: proposedProblem.finishedAt,
          explanationDisplayedAt: proposedProblem.explanationDisplayedAt,
        },
      });
    }
  }
}

export class TurnFactory {
  static initialize(userId: User['id']): Turn {
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
