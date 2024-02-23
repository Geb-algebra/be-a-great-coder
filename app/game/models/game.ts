export const TURNS = ['buy-ingredients', 'sell-products', 'solve-problems', 'get-reward'] as const;
export type Turn = (typeof TURNS)[number];

/**
 * Immutable object that stores amount of money, ingredients, products, upgrades, and data
 */
export class GameStatus {
  readonly money: number;
  private _ingredientStock: Map<string, number>;
  private _robotEfficiencyLevel: number;
  private _robotQualityLevel: number;

  constructor(
    money: number = 0,
    ingredientStock: Map<string, number> = new Map(),
    robotEfficiency = 1,
    robotQuality = 1,
  ) {
    this.money = money;
    this._ingredientStock = ingredientStock;
    this._robotEfficiencyLevel = robotEfficiency;
    this._robotQualityLevel = robotQuality;
  }

  get ingredientStock() {
    return new Map(this._ingredientStock);
  }

  get robotEfficiency() {
    return this._robotEfficiencyLevel;
  }

  get robotQuality() {
    return this._robotQualityLevel;
  }
}
