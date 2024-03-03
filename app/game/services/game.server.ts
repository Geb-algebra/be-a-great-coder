import { GameLogicViolated, ObjectNotFoundError } from '~/errors.ts';
import { GameStatus, type Turn, TURNS } from '../models/game.ts';
import type { User } from '~/accounts/models/account.ts';
import {
  GameStatusFactory,
  GameStatusRepository,
  TurnFactory,
  TurnRepository,
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

export async function getOrInitializeGameStatus(userId: User['id']) {
  try {
    return await GameStatusRepository.getOrThrow(userId);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      const gs = GameStatusFactory.initialize();
      await GameStatusRepository.save(userId, gs);
      return gs;
    }
    throw error;
  }
}

export class GameStatusUpdateService {
  static buyIngredients(currentGameStatus: GameStatus, ingredientName: string, quantity: number) {
    const cost = quantity * 100;
    if (currentGameStatus.money < cost) {
      throw new GameLogicViolated('Not enough money');
    }
    const newIngredientStock = new Map(currentGameStatus.ingredientStock);
    newIngredientStock.set(
      ingredientName,
      (newIngredientStock.get(ingredientName) || 0) + quantity,
    );
    return new GameStatus(
      currentGameStatus.money - cost,
      newIngredientStock,
      currentGameStatus.robotEfficiencyLevel,
      currentGameStatus.robotQualityLevel,
    );
  }

  static manufactureProducts(currentGameStatus: GameStatus, productName: string, quantity: number) {
    if (quantity > currentGameStatus.robotEfficiencyLevel) {
      throw new GameLogicViolated('Robot is not efficient enough');
    }
    const consumedAmountOfIngredients = 3 * quantity;
    if ((currentGameStatus.ingredientStock.get('iron') ?? 0) < consumedAmountOfIngredients) {
      throw new GameLogicViolated('Not enough ingredients');
    }
    const newIngredientStock = new Map(currentGameStatus.ingredientStock);
    for (const [ingredientName, amount] of currentGameStatus.ingredientStock) {
      newIngredientStock.set(ingredientName, amount - consumedAmountOfIngredients);
    }
    return {
      newStatus: new GameStatus(
        currentGameStatus.money,
        newIngredientStock,
        currentGameStatus.robotEfficiencyLevel,
        currentGameStatus.robotQualityLevel,
      ),
      quantity,
    };
  }

  static sellProducts(currentGameStatus: GameStatus, productStock: Map<string, number>) {
    const revenue = Array.from(productStock.entries()).reduce(
      (total, [productName, quantity]) => total + quantity * 400,
      0,
    );
    return new GameStatus(
      currentGameStatus.money + revenue,
      currentGameStatus.ingredientStock,
      currentGameStatus.robotEfficiencyLevel,
      currentGameStatus.robotQualityLevel,
    );
  }

  static applyRobotUpgrades(currentGameStatus: GameStatus, quantity: number) {
    return new GameStatus(
      currentGameStatus.money,
      currentGameStatus.ingredientStock,
      currentGameStatus.robotEfficiencyLevel + 2 * quantity,
      currentGameStatus.robotQualityLevel,
    );
  }

  static applyRobotData(currentGameStatus: GameStatus, quantity: number) {
    return new GameStatus(
      currentGameStatus.money,
      currentGameStatus.ingredientStock,
      currentGameStatus.robotEfficiencyLevel,
      currentGameStatus.robotQualityLevel + 2 * quantity,
    );
  }
}
