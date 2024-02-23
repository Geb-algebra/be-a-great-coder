import { GameStatus } from '../models/game.ts';
import { GameStatusUpdateService } from './game.server.ts';

describe('GameStatusUpdateService', () => {
  const initialGameStatus = new GameStatus(1000, new Map([['iron', 5]]), 3, 4);

  it('should buy ingredients', () => {
    const newGameStatus = GameStatusUpdateService.buyIngredients(initialGameStatus, 'iron', 5);
    expect(newGameStatus.money).toEqual(1000 - 100 * 5);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5 + 5);
  });

  it('should manufacture products', () => {
    const { newStatus, quantity } = GameStatusUpdateService.manufactureProducts(
      initialGameStatus,
      'sword',
      1,
    );
    expect(newStatus.money).toEqual(1000);
    expect(newStatus.ingredientStock.get('iron')).toEqual(5 - 3);
    expect(quantity).toEqual(1);
  });

  it('should sell products', () => {
    const newGameStatus = GameStatusUpdateService.sellProducts(
      initialGameStatus,
      new Map([['sword', 1]]),
    );
    expect(newGameStatus.money).toEqual(1000 + 400);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5);
  });

  it('should apply robot upgrades', () => {
    const newGameStatus = GameStatusUpdateService.applyRobotUpgrades(initialGameStatus, 1);
    expect(newGameStatus.money).toEqual(1000);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5);
    expect(newGameStatus.robotEfficiency).toEqual(3 + 2);
    expect(newGameStatus.robotQuality).toEqual(4);
  });
});
