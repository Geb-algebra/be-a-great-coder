export const PROBLEM_DIFFICULTIES = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000,
];

export function calcNumStoryPoints(problemDifficulty: number) {
  return problemDifficulty * 10;
}

/**
 * Calculate the offered reward using the difficulty of the problem
 * @param problemDifficulty: number (100, 200, ..., 1200?)
 */
export function calcOfferedReward(problemDifficulty: number) {
  function normalRandom(mu: number, sigma: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * sigma + mu;
  }

  function logNormalRandom(mu: number, sigma: number): number {
    const normalVal = normalRandom(mu, sigma);
    return Math.exp(normalVal);
  }

  // 使い方
  const mu = problemDifficulty / 100; // 正規分布の平均
  const sigma = 1; // 正規分布の標準偏差
  const logNormalVal = logNormalRandom(mu, sigma);
  const offeredReward = Math.round(logNormalVal * 1000);
  return offeredReward;
}

/**
 * Calculate the contracted reward using the offered reward and the problem solve level
 * @param offeredReward: number
 * @param problemSolveLevel: number (0 - 1)
 */
export function calcContractedReward(offeredReward: number, problemSolveLevel: number) {
  const contractReward = Math.round(offeredReward * problemSolveLevel);
  return contractReward;
}

export const WEEKS_PER_PROJECT = 12;
