import { calcLvAndResidual } from "../services/config";

export const TURNS = [
  "buy-ingredients",
  "forge-swords",
  "select-problems",
  "solve-problems",
  "get-reward",
] as const;
export type Turn = (typeof TURNS)[number];

type IngredientStock = Map<string, number>;

export class TotalAssets {
  readonly cash: number;
  readonly battery: number;
  private _ingredientStock: IngredientStock;

  constructor(money: number, battery: number, ingredientStock: IngredientStock) {
    this.cash = money;
    this.battery = battery;
    this._ingredientStock = ingredientStock;
  }

  get ingredientStock() {
    return new Map(this._ingredientStock);
  }
}

export type Problem = {
  id: string;
  title: string;
  difficulty: number;
};

export type Research = {
  id: string;
  problem: Problem;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  submittedAt: Date | null;
  solvedAt: Date | null;
  finishedAt: Date | null;
  answerShownAt: Date | null;
  rewardReceivedAt: Date | null;
  batteryCapacityExp: number | null;
  performanceExp: number | null;
};

export type LaboratoryValue = {
  batteryCapacityExp: number;
  performanceExp: number;
  researcherRank: number;
};

export class Laboratory {
  public researches: Research[];

  constructor(researches: Research[] = []) {
    this.researches = researches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  private get rewardedResearches() {
    return this.researches.filter((research) => research.rewardReceivedAt !== null);
  }

  get batteryCapacityExp() {
    return this.rewardedResearches
      .filter((research) => research.solvedAt !== null)
      .reduce((acc, research) => acc + (research.batteryCapacityExp ?? 0), 0);
  }

  get performanceExp() {
    return this.rewardedResearches
      .filter((research) => research.answerShownAt !== null && research.submittedAt !== null)
      .reduce((acc, research) => acc + (research.performanceExp ?? 0), 0);
  }

  get researcherRank() {
    return this.rewardedResearches
      .filter((research) => research.solvedAt !== null)
      .slice(-5)
      .reduce(
        (ave, research, index) => (ave * index + research.problem.difficulty) / (index + 1),
        0,
      );
  }

  get laboratoryValue(): LaboratoryValue {
    return {
      batteryCapacityExp: this.batteryCapacityExp,
      performanceExp: this.performanceExp,
      researcherRank: this.researcherRank,
    };
  }

  getCandidateResearches() {
    return this.researches.filter((research) => research.startedAt === null);
  }

  getUnfinishedResearch() {
    return this.researches.find(
      (research) => research.startedAt !== null && research.finishedAt === null,
    );
  }

  getUnrewardedResearch() {
    return this.researches.find(
      (research) => research.finishedAt !== null && research.rewardReceivedAt === null,
    );
  }
}
