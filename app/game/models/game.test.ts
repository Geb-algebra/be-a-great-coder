import { Laboratory } from './game.ts';

describe('Laboratory', async () => {
  let laboratory: Laboratory;
  beforeEach(() => {
    laboratory = new Laboratory();

    for (let i = 0; i < 6; i++) {
      laboratory.researches.push({
        id: `research-id-${i}`,
        problem: { id: `problem-id-${i}`, title: `problem-title-${i}`, difficulty: 100 * (i + 1) },
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        explanationDisplayedAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 100 * (i + 1),
        performanceIncrement: 100 * (i + 1),
      });
    }
  });

  it('should calculate batteryCapacity', () => {
    expect(laboratory.batteryCapacity).toBe(2101);
  });

  it('should calculate performance', () => {
    expect(laboratory.performance).toBe(2101);
  });

  it('should calculate researcherRank', () => {
    expect(laboratory.researcherRank).toBe(400);
  });
});
