import type { User } from "~/accounts/models/account.ts";
import {
  insertNewProblemsIfAllowed,
  queryRandomProblemByDifficulty,
} from "~/atcoder-info/models/problem.server.ts";
import { GameLogicViolated, ObjectNotFoundError } from "~/errors.ts";
import {
  TotalAssetsFactory,
  TotalAssetsRepository,
  TurnFactory,
  TurnRepository,
} from "../lifecycle/game.server.ts";
import {
  INGREDIENTS,
  type IngredientName,
  type Product,
  TURNS,
  TotalAssets,
  type Turn,
} from "../models/game.ts";
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
  static buyIngredients(
    currentTotalAssets: TotalAssets,
    ingredientName: IngredientName,
    quantity: number,
  ) {
    const ingredient = INGREDIENTS.find((ingredient) => ingredient.name === ingredientName);
    if (!ingredient) {
      throw new GameLogicViolated("Invalid ingredient name");
    }
    const cost = ingredient.price * quantity;
    if (currentTotalAssets.cash < cost) {
      throw new GameLogicViolated("Not enough money");
    }
    const newIngredientStock = new Map(currentTotalAssets.ingredientStock);
    newIngredientStock.set(
      ingredientName,
      (newIngredientStock.get(ingredientName) || 0) + quantity,
    );
    return new TotalAssets(
      currentTotalAssets.cash - cost,
      currentTotalAssets.battery,
      newIngredientStock,
    );
  }

  static manufactureProducts(currentTotalAssets: TotalAssets, product: Product, quantity: number) {
    if (quantity > currentTotalAssets.battery) {
      throw new GameLogicViolated("Not enough battery");
    }
    for (const [ingredientName, amount] of product.ingredients) {
      if ((currentTotalAssets.ingredientStock.get(ingredientName) ?? 0) < amount * quantity) {
        throw new GameLogicViolated("Not enough ingredients");
      }
    }
    const newIngredientStock = new Map(currentTotalAssets.ingredientStock);
    for (const [ingredientName, amount] of product.ingredients) {
      newIngredientStock.set(
        ingredientName,
        (newIngredientStock.get(ingredientName) || 0) - amount * quantity,
      );
    }
    return {
      newTotalAssets: new TotalAssets(
        currentTotalAssets.cash,
        currentTotalAssets.battery - quantity,
        newIngredientStock,
      ),
      quantity,
    };
  }

  static sellProducts(currentTotalAssets: TotalAssets, productStock: Map<Product, number>) {
    const revenue = Array.from(productStock.entries()).reduce(
      (total, [product, quantity]) => total + quantity * product.price,
      0,
    );
    return new TotalAssets(
      currentTotalAssets.cash + revenue,
      currentTotalAssets.battery,
      currentTotalAssets.ingredientStock,
    );
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
  await insertNewProblemsIfAllowed();
  return Promise.all(
    difficulties.map(async (difficulty) => {
      return await queryRandomProblemByDifficulty(difficulty, difficulty + 100, true);
    }),
  );
}
