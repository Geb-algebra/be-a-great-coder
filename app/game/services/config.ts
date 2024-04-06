export const PROBLEM_DIFFICULTIES = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000,
];

export function calcRobotGrowthRate(difficulty: number) {
  return Math.round(difficulty / 100);
}
