export const TURNS = ['buy-ingredients', 'sell-products', 'solve-problems', 'get-reward'] as const;
export type Turn = (typeof TURNS)[number];

/**
 * Immutable object that stores amount of money, ingredients, products, upgrades, and data
 */
export class GameStatus {
  readonly money: number;
  private _ingredientStock: Map<string, number>;
  readonly robotEfficiencyLevel: number;
  readonly robotQualityLevel: number;

  constructor(
    money: number = 0,
    ingredientStock: Map<string, number> = new Map(),
    robotEfficiencyLevel = 1,
    robotQualityLevel = 1,
  ) {
    this.money = money;
    this._ingredientStock = ingredientStock;
    this.robotEfficiencyLevel = robotEfficiencyLevel;
    this.robotQualityLevel = robotQualityLevel;
  }

  get ingredientStock() {
    return new Map(this._ingredientStock);
  }
}
