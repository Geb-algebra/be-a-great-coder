import { Laboratory } from './game.ts';

describe('Laboratory with no research', () => {
  let laboratory: Laboratory;
  beforeEach(() => {
    laboratory = new Laboratory();
  });

  it('should calculate batteryCapacity', () => {
    expect(laboratory.batteryCapacity).toBe(1);
  });

  it('should calculate performance', () => {
    expect(laboratory.performance).toBe(1);
  });

  it('should calculate researcherRank', () => {
    expect(laboratory.researcherRank).toBe(0);
  });
});

describe('Laboratory', async () => {
  let laboratory: Laboratory;
  test('with no researches', async () => {
    laboratory = new Laboratory();
    expect(laboratory.batteryCapacity).toBe(1);
    expect(laboratory.performance).toBe(1);
    expect(laboratory.researcherRank).toBe(0);
  });

  test('with failed research', async () => {
    laboratory = new Laboratory([
      {
        id: '1',
        problem: { id: '1', title: 'problem1', difficulty: 100 },
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 1,
      },
      {
        id: '2',
        problem: { id: '2', title: 'problem2', difficulty: 100 },
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 1,
      },
      {
        id: '3',
        problem: { id: '3', title: 'problem3', difficulty: 1000 },
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: null,
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 1,
      },
    ]);
    expect(laboratory.batteryCapacity).toBe(4);
    expect(laboratory.performance).toBe(4);
    expect(laboratory.researcherRank).toBe(100); // unsolved problem should not be counted
  });

  test('with unsolved research', async () => {
    laboratory = new Laboratory([
      {
        id: '1',
        problem: { id: '1', title: 'problem1', difficulty: 100 },
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 1,
      },
      {
        id: '2',
        problem: { id: '2', title: 'problem2', difficulty: 100 },
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 1,
      },
      {
        id: '3',
        problem: { id: '3', title: 'problem3', difficulty: 1000 },
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityIncrement: 10,
        performanceIncrement: 10,
      },
    ]);
    expect(laboratory.batteryCapacity).toBe(3);
    expect(laboratory.performance).toBe(3);
    expect(laboratory.researcherRank).toBe(100); // unsolved problem should not be counted
  });
});
