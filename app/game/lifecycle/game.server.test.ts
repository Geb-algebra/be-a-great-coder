import { prisma } from '~/db.server.ts';
import { GameStatus } from '../models/game.ts';
import {
  GameStatusRepository,
  ProposedProblemFactory,
  ProposedProblemRepository,
} from './game.server.ts';

describe('GameStatusRepository', () => {
  const userId = 'test-user-id';

  it('should save and get game status', async () => {
    const gameStatus = new GameStatus(
      1000,
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
      3,
      4,
    );
    await GameStatusRepository.save(userId, gameStatus);
    const savedGameStatus = await GameStatusRepository.getOrThrow(userId);
    expect(savedGameStatus).toEqual(gameStatus);
  });
});

describe('ProposedProblemFactory', () => {
  const userId = 'test-user-id';

  it('should create proposed problem', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    const proposedProblem = await ProposedProblemFactory.createAndSave(userId, problem);
    expect(proposedProblem.userId).toEqual(userId);
    expect(proposedProblem.problemId).toEqual(problem.id);
    expect(proposedProblem.finishedAt).toBeNull();
    expect(proposedProblem.explanationDisplayedAt).toBeNull();
  });
});

describe('ProposedProblemRepository', () => {
  const userId = 'test-user-id';

  it('should get proposed problems', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblems_ = await ProposedProblemRepository.get(userId);
    expect(proposedProblems_).toHaveLength(0);
    await ProposedProblemFactory.createAndSave(userId, problem);
    const proposedProblems = await ProposedProblemRepository.get(userId);
    expect(proposedProblems).toHaveLength(1);
    const proposedProblem = {
      ...proposedProblems[0],
      finishedAt: new Date(2024, 12, 31, 12, 34, 56),
    };
    await ProposedProblemRepository.save(proposedProblem);
    const updatedProposedProblems = await ProposedProblemRepository.get(userId);
    expect(updatedProposedProblems.map((p) => ({ ...p, updatedAt: undefined }))).toEqual([
      { ...proposedProblem, updatedAt: undefined },
    ]);
  });
});
