import { GameLogicViolated, ObjectNotFoundError } from '~/errors.ts';
import { TotalAssets, type Turn, TURNS } from '../models/game.ts';
import type { User } from '~/accounts/models/account.ts';
import {
  TurnFactory,
  TurnRepository,
  TotalAssetsFactory,
  TotalAssetsRepository,
} from '../lifecycle/game.server.ts';

export function getNextTurn(currentTurn: Turn): Turn {
  const currentIndex = TURNS.indexOf(currentTurn);
  return TURNS[(currentIndex + 1) % TURNS.length];
}

export async function getOrInitializeTurn(userId: User['id']) {
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

export async function getOrInitializeTotalAssets(userId: User['id']) {
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
  static buyIngredients(currentTotalAssets: TotalAssets, ingredientName: string, quantity: number) {
    const cost = quantity * 100;
    if (currentTotalAssets.cash < cost) {
      throw new GameLogicViolated('Not enough money');
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

  static manufactureProducts(
    currentTotalAssets: TotalAssets,
    productName: string,
    quantity: number,
  ) {
    if (quantity > currentTotalAssets.battery) {
      throw new GameLogicViolated('Battery is not enough');
    }
    const consumedAmountOfIngredients = 3 * quantity;
    if ((currentTotalAssets.ingredientStock.get('iron') ?? 0) < consumedAmountOfIngredients) {
      throw new GameLogicViolated('Not enough ingredients');
    }
    const newIngredientStock = new Map(currentTotalAssets.ingredientStock);
    for (const [ingredientName, amount] of currentTotalAssets.ingredientStock) {
      newIngredientStock.set(ingredientName, amount - consumedAmountOfIngredients);
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

  static sellProducts(currentTotalAssets: TotalAssets, productStock: Map<string, number>) {
    const revenue = Array.from(productStock.entries()).reduce(
      (total, [productName, quantity]) => total + quantity * 400,
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
