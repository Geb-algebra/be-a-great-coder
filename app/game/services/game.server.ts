import type { User } from "~/accounts/models/account.ts";
import {
  insertNewProblemsIfNeeded,
  queryRandomProblemByDifficulty,
} from "~/atcoder-info/models/problem.server.ts";
import { GameLogicViolated, ObjectNotFoundError } from "~/errors.ts";
import {
  TotalAssetsFactory,
  TotalAssetsRepository,
  TurnFactory,
  TurnRepository,
} from "../lifecycle/game.server.ts";
import { TURNS, TotalAssets, type Turn } from "../models/game.ts";
import type { BaseMetal, Gem } from "../models/ingredients.ts";
import { INGREDIENTS, SWORDS, calcSwordElement, calcSwordGrade } from "../services/config.ts";
import { PROBLEM_DIFFICULTIES } from "./config.ts";

export function getNextTurn(currentTurn: Turn): Turn {
  const currentIndex = TURNS.indexOf(currentTurn);
  return TURNS[(currentIndex + 1) % TURNS.length];
}

export async function getOrInitializeTurn(userId: User["id"]) {
  try {
    return await TurnRepository.getOrThrow(userId);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      const turn = TurnFactory.initialize();
      await TurnRepository.save(userId, turn);
      return turn;
    }
    throw error;
  }
}

export async function getOrInitializeTotalAssets(userId: User["id"]) {
  try {
    return await TotalAssetsRepository.getOrThrow(userId);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      const totalAssets = TotalAssetsFactory.initialize();
      await TotalAssetsRepository.save(userId, totalAssets);
      return totalAssets;
    }
    throw error;
  }
}

export class TotalAssetsUpdateService {
  static buyIngredients(currentTotalAssets: TotalAssets, ingredientId: string, quantity: number) {
    const ingredient = INGREDIENTS.get(ingredientId);
    if (!ingredient) {
      throw new GameLogicViolated(`Invalid ingredient id: ${ingredientId}`);
    }
    const cost = ingredient.price * quantity;
    if (currentTotalAssets.cash < cost) {
      throw new GameLogicViolated("Not enough money");
    }
    const newIngredientStock = new Map(currentTotalAssets.ingredientStock);
    newIngredientStock.set(ingredientId, (newIngredientStock.get(ingredientId) || 0) + quantity);
    return new TotalAssets(
      currentTotalAssets.cash - cost,
      currentTotalAssets.battery,
      newIngredientStock,
    );
  }

  static forgeAndSellSword(currentTotalAssets: TotalAssets, baseMetal: BaseMetal, gem: Gem) {
    if (currentTotalAssets.battery === 0) {
      throw new GameLogicViolated("Not enough battery");
    }
    const bmStock = currentTotalAssets.ingredientStock.get(baseMetal.id);
    if (bmStock === undefined) throw new GameLogicViolated(`invalid basemetal id: ${baseMetal.id}`);
    if (bmStock < 1) {
      throw new GameLogicViolated("Not enough base metals");
    }
    const gemStock = currentTotalAssets.ingredientStock.get(gem.id);
    if (gemStock === undefined) throw new GameLogicViolated(`invalid gem id: ${gem.id}`);
    if (gemStock < 1) {
      throw new GameLogicViolated("Not enough gems");
    }

    const grade = calcSwordGrade(baseMetal);
    const element = calcSwordElement(gem);
    const sword = SWORDS.get(element)?.[grade.baseGrade + grade.bonusGrade - 1];
    if (!sword)
      throw new GameLogicViolated(`Invalid sword element: ${element} and grade: ${grade}`);
    const newIngredientStock = new Map(currentTotalAssets.ingredientStock);
    newIngredientStock.set(baseMetal.id, bmStock - 1);
    newIngredientStock.set(gem.id, gemStock - 1);
    return {
      newTotalAssets: new TotalAssets(
        currentTotalAssets.cash + sword.price,
        currentTotalAssets.battery - 1,
        newIngredientStock,
      ),
      grade,
      element,
      sword,
    };
  }

  static chargeBattery(currentTotalAssets: TotalAssets, capacity: number) {
    return new TotalAssets(currentTotalAssets.cash, capacity, currentTotalAssets.ingredientStock);
  }
}

export function getDifficultiesMatchUserRank(rank: number) {
  const closestRankIndex = PROBLEM_DIFFICULTIES.findIndex((difficulty) => difficulty >= rank);
  if (closestRankIndex === -1 || closestRankIndex >= PROBLEM_DIFFICULTIES.length - 2) {
    return PROBLEM_DIFFICULTIES.slice(-3);
  }
  const firstIndex = Math.max(0, closestRankIndex - 1);
  return PROBLEM_DIFFICULTIES.slice(firstIndex, firstIndex + 3);
}

export async function getProblemsMatchUserRank(rank: number) {
  const difficulties = getDifficultiesMatchUserRank(rank);
  await insertNewProblemsIfNeeded();
  return Promise.all(
    difficulties.map(async (difficulty) => {
      return await queryRandomProblemByDifficulty(difficulty, difficulty + 100, true);
    }),
  );
}
