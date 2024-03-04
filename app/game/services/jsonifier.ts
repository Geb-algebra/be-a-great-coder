import { Laboratory, type Problem, TotalAssets } from '../models/game';

export type TotalAssetsJson = {
  cash: number;
  battery: number;
  ingredientStock: [string, number][];
};

export class TotalAssetsJsonifier {
  static toJson(totalAssets: TotalAssets): TotalAssetsJson {
    return {
      cash: totalAssets.cash,
      battery: totalAssets.battery,
      ingredientStock: Array.from(totalAssets.ingredientStock),
    };
  }

  static fromJson(json: TotalAssetsJson) {
    return new TotalAssets(json.cash, json.battery, new Map(json.ingredientStock));
  }
}

export type ResearchJson = {
  id: string;
  problem: Problem;
  userId: string;
  createdAt: string;
  updatedAt: string;
  solvedAt: string | null;
  finishedAt: string | null;
  explanationDisplayedAt: string | null;
  rewardReceivedAt: string | null;
  batteryCapacityIncrement: number | null;
  performanceIncrement: number | null;
};

export type LaboratoryJson = {
  researches: ResearchJson[];
};

export class LaboratoryJsonifier {
  static toJson(laboratory: Laboratory): LaboratoryJson {
    return {
      researches: laboratory.researches.map((research) => ({
        id: research.id,
        problem: research.problem,
        userId: research.userId,
        createdAt: research.createdAt.toISOString(),
        updatedAt: research.updatedAt.toISOString(),
        solvedAt: research.solvedAt?.toISOString() ?? null,
        finishedAt: research.finishedAt?.toISOString() ?? null,
        explanationDisplayedAt: research.explanationDisplayedAt?.toISOString() ?? null,
        rewardReceivedAt: research.rewardReceivedAt?.toISOString() ?? null,
        batteryCapacityIncrement: research.batteryCapacityIncrement,
        performanceIncrement: research.performanceIncrement,
      })),
    };
  }

  static fromJson(json: LaboratoryJson) {
    return new Laboratory(
      json.researches.map((research) => ({
        ...research,
        createdAt: new Date(research.createdAt),
        updatedAt: new Date(research.updatedAt),
        solvedAt: research.solvedAt ? new Date(research.solvedAt) : null,
        finishedAt: research.finishedAt ? new Date(research.finishedAt) : null,
        explanationDisplayedAt: research.explanationDisplayedAt
          ? new Date(research.explanationDisplayedAt)
          : null,
        rewardReceivedAt: research.rewardReceivedAt ? new Date(research.rewardReceivedAt) : null,
      })),
    );
  }
}
