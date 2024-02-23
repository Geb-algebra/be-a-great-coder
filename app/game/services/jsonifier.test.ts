import { GameStatus } from '../models/game.ts';
import { GameStatusJsonifier } from './jsonifier.ts';

describe('GameStatusJsonifier', () => {
  it('should convert to json', () => {
    const gameStatus = new GameStatus(1000, new Map([['iron', 5]]), 3, 4);
    const json = GameStatusJsonifier.toJson(gameStatus);
    expect(json).toEqual({
      money: 1000,
      ingredientStock: [['iron', 5]],
      robotEfficiency: 3,
      robotQuality: 4,
    });
  });

  it('should convert from json', () => {
    const json = {
      money: 1000,
      ingredientStock: [['iron', 5]] as [string, number][],
      robotEfficiency: 3,
      robotQuality: 4,
    };
    const gameStatus = GameStatusJsonifier.fromJson(json);
    expect(gameStatus.money).toEqual(1000);
    expect(gameStatus.ingredientStock.get('iron')).toEqual(5);
    expect(gameStatus.robotEfficiency).toEqual(3);
    expect(gameStatus.robotQuality).toEqual(4);
  });
});
