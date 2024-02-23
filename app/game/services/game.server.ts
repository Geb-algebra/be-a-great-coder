import { GameStatus, type Turn, TURNS } from '../models/game.ts';

export function getNextTurn(currentTurn: Turn): Turn {
  const currentIndex = TURNS.indexOf(currentTurn);
  return TURNS[(currentIndex + 1) % TURNS.length];
}

export class GameStatusUpdateService {
  static buyIngredients(currentGameStatus: GameStatus, ingredientName: string, quantity: number) {
    const cost = quantity * 100;
    if (currentGameStatus.money < cost) {
      throw new Error('Not enough money');
    }
    const newIngredientStock = new Map(currentGameStatus.ingredientStock);
    newIngredientStock.set(
      ingredientName,
      (newIngredientStock.get(ingredientName) || 0) + quantity,
    );
    return new GameStatus(currentGameStatus.money - cost, newIngredientStock);
  }

  static manufactureProducts(currentGameStatus: GameStatus, productName: string, quantity: number) {
    const consumedAmountOfIngredients = 3 * quantity;
    const newIngredientStock = new Map(currentGameStatus.ingredientStock);
    for (const [ingredientName, amount] of currentGameStatus.ingredientStock) {
      newIngredientStock.set(ingredientName, amount - consumedAmountOfIngredients);
    }
    return {
      newStatus: new GameStatus(currentGameStatus.money, newIngredientStock),
      quantity,
    };
  }

  static sellProducts(currentGameStatus: GameStatus, productStock: Map<string, number>) {
    const revenue = Array.from(productStock.entries()).reduce(
      (total, [productName, quantity]) => total + quantity * 400,
      0,
    );
    return new GameStatus(currentGameStatus.money + revenue, currentGameStatus.ingredientStock);
  }

  static applyRobotUpgrades(currentGameStatus: GameStatus, quantity: number) {
    return new GameStatus(
      currentGameStatus.money,
      currentGameStatus.ingredientStock,
      currentGameStatus.robotEfficiency + 2 * quantity,
      currentGameStatus.robotQuality,
    );
  }

  static applyRobotData(currentGameStatus: GameStatus, quantity: number) {
    return new GameStatus(
      currentGameStatus.money,
      currentGameStatus.ingredientStock,
      currentGameStatus.robotEfficiency,
      currentGameStatus.robotQuality + 2 * quantity,
    );
  }
}
