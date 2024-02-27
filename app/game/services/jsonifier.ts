import { GameStatus } from '../models/game.ts';

export type GameStatusJson = {
  money: number;
  ingredientStock: [string, number][];
  robotEfficiencyLevel: number;
  robotQualityLevel: number;
};

export class GameStatusJsonifier {
  static toJson(gameStatus: GameStatus): GameStatusJson {
    return {
      money: gameStatus.money,
      ingredientStock: Array.from(gameStatus.ingredientStock.entries()),
      robotEfficiencyLevel: gameStatus.robotEfficiencyLevel,
      robotQualityLevel: gameStatus.robotQualityLevel,
    };
  }

  static fromJson(json: GameStatusJson) {
    return new GameStatus(
      json.money,
      new Map(json.ingredientStock),
      json.robotEfficiencyLevel,
      json.robotQualityLevel,
    );
  }
}
