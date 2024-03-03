import { prisma } from '~/db.server.ts';
import { GameStatus } from '../models/game.ts';
import {
  GameStatusRepository,
  ProposedProblemFactory,
  ProposedProblemRepository,
} from './game.server.ts';
import { ObjectNotFoundError } from '~/errors.ts';

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
    await prisma.problem.create({ data: problem });
    const proposedProblem = await ProposedProblemFactory.create(userId, problem);
    expect(proposedProblem.userId).toEqual(userId);
    expect(proposedProblem.problem.id).toEqual(problem.id);
    expect(proposedProblem.finishedAt).toBeNull();
    expect(proposedProblem.explanationDisplayedAt).toBeNull();
  });

  it('should throw error if problem does not exist on DB', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const problemId = 'non-existing-problem-id';
    expect(ProposedProblemFactory.create(userId, { ...problem, id: problemId })).rejects.toThrow(
      ObjectNotFoundError,
    );
  });
});

describe('ProposedProblemRepository', () => {
  const userId = 'test-user-id';

  it('should save proposed problem', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblem = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(proposedProblem);
    const savedProposedProblem = await ProposedProblemRepository.get(userId);
    expect(savedProposedProblem).toEqual([
      {
        id: proposedProblem.id,
        problem: proposedProblem.problem,
        userId: proposedProblem.userId,
        createdAt: proposedProblem.createdAt,
        updatedAt: proposedProblem.updatedAt,
        solvedAt: null,
        finishedAt: null,
        explanationDisplayedAt: null,
        rewardReceivedAt: null,
      },
    ]);
  });

  it('should update solvedAt', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblem = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(proposedProblem);
    const before = await ProposedProblemRepository.get(userId);
    expect(before[0].solvedAt).toBeNull();
    proposedProblem.solvedAt = new Date();
    await ProposedProblemRepository.save(proposedProblem);
    const updatedProposedProblem = await ProposedProblemRepository.get(userId);
    expect(updatedProposedProblem[0].solvedAt).toEqual(proposedProblem.solvedAt);
  });

  it('should update finishedAt', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblem = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(proposedProblem);
    const before = await ProposedProblemRepository.get(userId);
    expect(before[0].finishedAt).toBeNull();
    proposedProblem.finishedAt = new Date();
    await ProposedProblemRepository.save(proposedProblem);
    const updatedProposedProblem = await ProposedProblemRepository.get(userId);
    expect(updatedProposedProblem[0].finishedAt).toEqual(proposedProblem.finishedAt);
  });

  it('should update explanationDisplayedAt', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblem = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(proposedProblem);
    const before = await ProposedProblemRepository.get(userId);
    expect(before[0].explanationDisplayedAt).toBeNull();
    proposedProblem.explanationDisplayedAt = new Date();
    await ProposedProblemRepository.save(proposedProblem);
    const updatedProposedProblem = await ProposedProblemRepository.get(userId);
    expect(updatedProposedProblem[0].explanationDisplayedAt).toEqual(
      proposedProblem.explanationDisplayedAt,
    );
  });

  it('should update rewardReceivedAt', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblem = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(proposedProblem);
    const before = await ProposedProblemRepository.get(userId);
    expect(before[0].rewardReceivedAt).toBeNull();
    proposedProblem.rewardReceivedAt = new Date();
    await ProposedProblemRepository.save(proposedProblem);
    const updatedProposedProblem = await ProposedProblemRepository.get(userId);
    expect(updatedProposedProblem[0].rewardReceivedAt).toEqual(proposedProblem.rewardReceivedAt);
  });

  it('should get proposed problems', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const proposedProblems_ = await ProposedProblemRepository.get(userId);
    expect(proposedProblems_).toHaveLength(0);
    const pp = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(pp);
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

  it('should get unfinished proposed problem', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const finishedPP = await ProposedProblemFactory.create(userId, problem);
    finishedPP.finishedAt = new Date();
    await ProposedProblemRepository.save(finishedPP);
    const unfinishedPP = await ProposedProblemFactory.create(userId, problem);
    await ProposedProblemRepository.save(unfinishedPP);
    const unfinishedProposedProblem = await ProposedProblemRepository.getUnfinished(userId);
    expect(unfinishedProposedProblem).toMatchObject(unfinishedPP);
  });

  it('should get reward unreceived proposed problem', async () => {
    const problem = {
      id: 'problem-id',
      title: 'problem-title',
      difficulty: 100,
    };
    await prisma.problem.create({ data: problem });
    const receivedPP = await ProposedProblemFactory.create(userId, problem);
    receivedPP.finishedAt = new Date();
    receivedPP.rewardReceivedAt = new Date();
    await ProposedProblemRepository.save(receivedPP);
    const unreceivedPP = await ProposedProblemFactory.create(userId, problem);
    unreceivedPP.finishedAt = new Date();
    await ProposedProblemRepository.save(unreceivedPP);
    const unreceivedProposedProblem = await ProposedProblemRepository.getRewardUnreceived(userId);
    expect(unreceivedProposedProblem).toMatchObject(unreceivedPP);
  });
});
