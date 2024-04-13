import {
  LaboratoryRepository,
  ResearchFactory,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import Component, { loader, action } from './get-reward.tsx';
import { action as showAnswerAction } from './get-reward.show-answer.tsx';
import Layout, { loader as layoutLoader } from './_layout.tsx';
import { loader as routerLoader } from './router.tsx';
import { loader as buyLoader } from './buy-ingredients.tsx';
import { render, screen } from '@testing-library/react';
import { addAuthenticationSessionTo, authenticated, setupAccount } from '~/routes/test/utils.ts';
import { prisma } from '~/db.server.ts';
import { createRemixStub } from '@remix-run/testing';
import {
  beginnersJson,
  initialJson,
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  veteransJson,
} from '~/routes/test/data.ts';
import type { Account } from '~/accounts/models/account.ts';
import userEvent from '@testing-library/user-event';
import invariant from 'tiny-invariant';
import { createId } from '@paralleldrive/cuid2';

const RemixStub = createRemixStub([
  {
    path: '/play',
    loader: authenticated(layoutLoader),
    Component: Layout,
    children: [
      {
        path: '/play/get-reward',
        loader: authenticated(loader),
        action: authenticated(action),
        Component,
        children: [
          {
            path: '/play/get-reward/show-answer',
            action: authenticated(showAnswerAction),
          },
        ],
      },
      {
        path: '/play/router',
        loader: authenticated(routerLoader),
      },
      {
        path: '/play/buy-ingredients',
        loader: authenticated(buyLoader),
        Component: () => <div />,
      },
    ],
  },
]);

describe.each([
  ['newcomers', setInitialStatus, initialJson],
  ['beginners', setBeginnersStatus, beginnersJson],
  ['veterans', setVeteransStatus, veteransJson],
])('Page for %s', (_, statusSetter, status) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, 'get-reward');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-12-31T00:00:00Z'));
    await statusSetter(account.id);
    vi.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    const problem = await prisma.problem.create({
      data: {
        id: createId(),
        title: 'testproblemtitle',
        difficulty: 300,
      },
    });
    const newResearch = await ResearchFactory.create(account.id, problem.id);
    newResearch.finishedAt = new Date();
    await LaboratoryRepository.addResearch(account.id, newResearch);
    vi.useRealTimers();
  });

  it('renders the page with solved=False', async () => {
    render(<RemixStub initialEntries={['/play/get-reward']} />);
    await screen.findByRole('heading', { name: /get reward/i });
    await screen.findByText(/testproblemtitle/i);
    await screen.findByText('300');
    await screen.findByText(/started at: 2022-01-01T00:00:00/i);
    await screen.findByText(/Cleared\?: false/i);
    await screen.findByText(/Show answer/i);
    await screen.findByRole('button', { name: /get reward/i });
  });

  it('renders the page with solved=True', async () => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, 'unrewardedResearch should be defined');
    unrewardedResearch.solvedAt = new Date();
    await LaboratoryRepository.updateUnrewardedResearch(account.id, laboratory);
    render(<RemixStub initialEntries={['/play/get-reward']} />);
    await screen.findByRole('heading', { name: /get reward/i });
    await screen.findByText(/testproblemtitle/i);
    await screen.findByText('300');
    await screen.findByText(/started at: 2022-01-01T00:00:00/i);
    await screen.findByText(/Cleared\?: true/i);
    await screen.findByText(/Show answer/i);
    await screen.findByRole('button', { name: /get reward/i });
  });

  it.todo.each([
    ['solved=False', false],
    ['solved=True', true],
  ])('gives reward on click get reward for %s', async (_, isSolved) => {
    if (isSolved) {
      const laboratory = await LaboratoryRepository.get(account.id);
      const unrewardedResearch = laboratory.getUnrewardedResearch();
      invariant(unrewardedResearch, 'unrewardedResearch should be defined');
      unrewardedResearch.solvedAt = new Date();
      await LaboratoryRepository.updateUnrewardedResearch(account.id, laboratory);
    }
    render(<RemixStub initialEntries={['/play/get-reward']} />);
    await screen.findByText(RegExp(`cash: ${status.totalAssetsJson.cash}`, 'i'));
    await screen.findByText(
      RegExp(
        `battery: ${status.totalAssetsJson.battery} / ${status.laboratoryValue.batteryCapacity}`,
        'i',
      ),
    );
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance}`, 'i'),
    );
    const getRewardButton = await screen.findByRole('button', { name: /get reward/i });
    const user = userEvent.setup();
    await user.click(getRewardButton);
    await screen.findByText(RegExp(`cash: ${status.totalAssetsJson.cash}`, 'i'));
    const newCapa = status.laboratoryValue.batteryCapacity + (isSolved ? 3 : 0); // 3 is difficulty / 100
    await screen.findByText(RegExp(`battery: ${newCapa} / ${newCapa}`, 'i')); // fully charged
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance}`, 'i'),
    ); // no change because the answer is not shown
  });

  it.todo.each([
    ['answerShown=False', false],
    ['answerShown=True', true],
  ])('gives reward on click get reward for %s', async (_, isShown) => {
    render(<RemixStub initialEntries={['/play/get-reward']} />);
    await screen.findByText(RegExp(`cash: ${status.totalAssetsJson.cash}`, 'i'));
    await screen.findByText(
      RegExp(
        `battery: ${status.totalAssetsJson.battery} / ${status.laboratoryValue.batteryCapacity}`,
        'i',
      ),
    );
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance}`, 'i'),
    );
    const showAnswerbutton = await screen.findByRole('button', { name: /show answer/i });
    const user = userEvent.setup();
    await user.click(showAnswerbutton);
    const getRewardButton = await screen.findByRole('button', { name: /get reward/i });
    await user.click(getRewardButton);
    await screen.findByText(RegExp(`cash: ${status.totalAssetsJson.cash}`, 'i'));
    const newCapa = status.laboratoryValue.batteryCapacity; // no change because the problem is not solved
    await screen.findByText(RegExp(`battery: ${newCapa} / ${newCapa}`, 'i')); // fully charged
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance + (isShown ? 3 : 0)}`, 'i'),
    );
  });
});

describe('action', () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, 'get-reward');
    await setVeteransStatus(account.id);
    const problem = await prisma.problem.create({
      data: {
        id: createId(),
        title: 'testproblemtitle',
        difficulty: 300,
      },
    });
    const newResearch = await ResearchFactory.create(account.id, problem.id);
    newResearch.finishedAt = new Date();
    await LaboratoryRepository.addResearch(account.id, newResearch);
  });
  afterEach(() => {
    // restoring date after each test run
  });
  it('gives batteries if the problem is solved', async () => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, 'unrewardedResearch should be defined');
    unrewardedResearch.solvedAt = new Date();
    await LaboratoryRepository.updateUnrewardedResearch(account.id, laboratory);

    const oldLab = await LaboratoryRepository.get(account.id);
    expect(oldLab.batteryCapacity).toBe(veteransJson.laboratoryValue.batteryCapacity);

    const request = new Request('http://localhost:3000/play/get-reward', {
      method: 'POST',
    });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });

    const updatedLaboratory = await LaboratoryRepository.get(account.id);
    const latestResearch = updatedLaboratory.getLatestResearch();
    invariant(latestResearch, 'solvedResearch should be defined');
    expect(latestResearch.rewardReceivedAt).toBeDefined();
    expect(latestResearch.batteryCapacityIncrement).toBe(3);
    expect(latestResearch.performanceIncrement).toBe(null);
    expect(updatedLaboratory.batteryCapacity).toBe(
      veteransJson.laboratoryValue.batteryCapacity + 3,
    );
    expect(updatedLaboratory.performance).toBe(veteransJson.laboratoryValue.performance);
  });
  it('gives performances if the explanation of the problem hasdisplayed', async () => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, 'unrewardedResearch should be defined');
    unrewardedResearch.answerShownAt = new Date();
    await LaboratoryRepository.updateUnrewardedResearch(account.id, laboratory);

    const oldLab = await LaboratoryRepository.get(account.id);
    expect(oldLab.batteryCapacity).toBe(veteransJson.laboratoryValue.batteryCapacity);
    expect(oldLab.getUnrewardedResearch()?.solvedAt).toBeDefined();

    const request = new Request('http://localhost:3000/play/get-reward', {
      method: 'POST',
    });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });

    const updatedLaboratory = await LaboratoryRepository.get(account.id);
    const solvedResearch = updatedLaboratory.getLatestResearch();
    expect(solvedResearch.rewardReceivedAt).toBeDefined();
    expect(solvedResearch.batteryCapacityIncrement).toBe(null);
    expect(solvedResearch.performanceIncrement).toBe(3);
    expect(updatedLaboratory.batteryCapacity).toBe(veteransJson.laboratoryValue.batteryCapacity);
    expect(updatedLaboratory.performance).toBe(veteransJson.laboratoryValue.performance + 3);
  });
});
