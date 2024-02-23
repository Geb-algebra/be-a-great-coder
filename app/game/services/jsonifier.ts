import { GameStatus } from '../models/game.ts';

export type GameStatusJson = {
  money: number;
  ingredientStock: [string, number][];
  robotEfficiency: number;
  robotQuality: number;
};

export class GameStatusJsonifier {
  static toJson(gameStatus: GameStatus): GameStatusJson {
    return {
      money: gameStatus.money,
      ingredientStock: Array.from(gameStatus.ingredientStock.entries()),
      robotEfficiency: gameStatus.robotEfficiency,
      robotQuality: gameStatus.robotQuality,
    };
  }

  static fromJson(json: GameStatusJson) {
    return new GameStatus(
      json.money,
      new Map(json.ingredientStock),
      json.robotEfficiency,
      json.robotQuality,
    );
  }
}
