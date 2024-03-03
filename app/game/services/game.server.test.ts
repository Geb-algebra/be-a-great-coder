import { GameLogicViolated } from '~/errors.ts';
import { GameStatus } from '../models/game.ts';
import { GameStatusUpdateService } from './game.server.ts';

describe('GameStatusUpdateService', () => {
  const initialGameStatus = new GameStatus(1000, new Map([['iron', 5]]), 3, 4);

  it('should buy ingredients', () => {
    const newGameStatus = GameStatusUpdateService.buyIngredients(initialGameStatus, 'iron', 5);
    expect(newGameStatus.money).toEqual(1000 - 100 * 5);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5 + 5);
    expect(newGameStatus.robotEfficiencyLevel).toEqual(3);
    expect(newGameStatus.robotQualityLevel).toEqual(4);
  });

  it('should not buy ingredients if not enough money', () => {
    expect(() => {
      GameStatusUpdateService.buyIngredients(initialGameStatus, 'iron', 11);
    }).toThrow(GameLogicViolated);
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
    expect(newStatus.robotEfficiencyLevel).toEqual(3);
    expect(newStatus.robotQualityLevel).toEqual(4);
  });

  it('should not manufacture products if not enough ingredients', () => {
    expect(() => {
      GameStatusUpdateService.manufactureProducts(initialGameStatus, 'sword', 2);
    }).toThrow(GameLogicViolated);
  });

  it('should sell products', () => {
    const newGameStatus = GameStatusUpdateService.sellProducts(
      initialGameStatus,
      new Map([['sword', 1]]),
    );
    expect(newGameStatus.money).toEqual(1000 + 400);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5);
    expect(newGameStatus.robotEfficiencyLevel).toEqual(3);
    expect(newGameStatus.robotQualityLevel).toEqual(4);
  });

  it('should apply robot upgrades', () => {
    const newGameStatus = GameStatusUpdateService.applyRobotUpgrades(initialGameStatus, 1);
    expect(newGameStatus.money).toEqual(1000);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5);
    expect(newGameStatus.robotEfficiencyLevel).toEqual(3 + 2);
    expect(newGameStatus.robotQualityLevel).toEqual(4);
  });

  it('should apply robot data', () => {
    const newGameStatus = GameStatusUpdateService.applyRobotData(initialGameStatus, 1);
    expect(newGameStatus.money).toEqual(1000);
    expect(newGameStatus.ingredientStock.get('iron')).toEqual(5);
    expect(newGameStatus.robotEfficiencyLevel).toEqual(3);
    expect(newGameStatus.robotQualityLevel).toEqual(4 + 2);
  });
});
