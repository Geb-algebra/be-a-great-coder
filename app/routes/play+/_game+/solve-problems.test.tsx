import { setBeginnersStatus, setInitialStatus, setVeteransStatus } from '~/routes/test/data';
import Component, { loader, action } from './solve-problems';
import { render, screen } from '@testing-library/react';
import {
  LaboratoryRepository,
  ResearchFactory,
  TurnRepository,
} from '~/game/lifecycle/game.server';
import { addAuthenticationSessionTo, authenticated, setupAccount } from '~/routes/test/utils';
import type { Account } from '~/accounts/models/account';
import { prisma } from '~/db.server';
import { createRemixStub } from '@remix-run/testing';
import { server } from 'mocks/mock-server';
import { http } from 'msw';
import userEvent from '@testing-library/user-event';
import { TURNS } from '~/game/models/game';

describe.each([
  ['newcomers', setInitialStatus],
  ['beginners', setBeginnersStatus],
  ['veterans', setVeteransStatus],
])('Page for %s', (_, statusSetter) => {
  let account: Account;
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-12-31T00:00:00Z'));
    account = await setupAccount();
    await TurnRepository.save(account.id, 'solve-problems');
    await statusSetter(account.id);
    vi.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    await prisma.problem.create({
      data: {
        id: 'testproblemid',
        title: 'testproblemtitle',
        difficulty: 300,
      },
    });
    const newResearch = await ResearchFactory.create(account.id, 'testproblemid');
    await LaboratoryRepository.addResearch(account.id, newResearch);
    vi.useRealTimers();
  });
  it('renders the page with unsolved state', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/play/solve-problems',
        loader: authenticated(loader),
        action: authenticated(action),
        Component,
      },
    ]);
    render(<RemixStub initialEntries={['/play/solve-problems']} />);
    await screen.findByRole('heading', { name: /solve the problem/i });
    await screen.findByText(/testproblemtitle/i);
    await screen.findByText('300');
    await screen.findByRole('link', { name: /go to problem page/i });
    await screen.findByText(/started at: 2022-01-01T00:00:00/i);
    await screen.findByRole('button', { name: /finish/i });
  });
  it('renders the page with solved state', async () => {
    server.use(
      http.get('https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions', () => {
        return new Response(
          JSON.stringify([
            {
              id: 5870139,
              epoch_second: new Date('2022-01-01T01:00:00Z').getTime() / 1000,
              problem_id: 'testproblemid',
              contest_id: 'fake',
              user_id: 'testuser',
              language: 'C# (Mono 4.6.2.0)',
              point: 1024,
              length: 754,
              result: 'AC',
              execution_time: 143,
            },
          ]),
          { status: 200 },
        );
      }),
    );
    const RemixStub = createRemixStub([
      {
        path: '/play/solve-problems',
        loader: authenticated(loader),
        action: authenticated(action),
        Component,
      },
    ]);
    render(<RemixStub initialEntries={['/play/solve-problems']} />);
    await screen.findByRole('heading', { name: /solve the problem/i });
    await screen.findByText(/testproblemtitle/i);
    await screen.findByText('300');
    await screen.findByRole('link', { name: /go to problem page/i });
    await screen.findByText(/started at: 2022-01-01T00:00:00/i);
    await screen.findByText(/cleared at: 2022-01-01T01:00:00/i);
    await screen.findByRole('button', { name: /finish/i });
  });
  it('redirects to /play/router on click of the finish button', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/play/solve-problems',
        loader: authenticated(loader),
        action: authenticated(action),
        Component,
      },
      {
        path: '/play/router',
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ]);
    render(<RemixStub initialEntries={['/play/solve-problems']} />);
    await screen.findByRole('heading', { name: /solve the problem/i });
    const finishButton = await screen.findByRole('button', { name: /finish/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
  it.each(TURNS.filter((v) => v !== 'solve-problems'))(
    'redirects to /play/router if the turn is %s',
    async (turn) => {
      await TurnRepository.save(account.id, turn);
      const RemixStub = createRemixStub([
        {
          path: '/play/solve-problems',
          loader: authenticated(loader),
          Component,
        },
        {
          path: '/play/router',
          Component: () => <div>Test Succeeded 😆</div>,
        },
      ]);
      render(<RemixStub initialEntries={['/play/solve-problems']} />);
      await screen.findByText(/test succeeded/i);
    },
  );
});

describe('action', () => {
  let account: Account;
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-12-31T00:00:00Z'));
    account = await setupAccount();
    await TurnRepository.save(account.id, 'solve-problems');
    await setVeteransStatus(account.id);
    vi.setSystemTime(new Date('2022-01-01T00:00:00Z'));
    await prisma.problem.create({
      data: {
        id: 'testproblemid',
        title: 'testproblemtitle',
        difficulty: 1000,
      },
    });
    const newResearch = await ResearchFactory.create(account.id, 'testproblemid');
    await LaboratoryRepository.addResearch(account.id, newResearch);
    vi.useRealTimers();
  });
  it('finishes the research and redirects to /play/router', async () => {
    const oldLaboratory = await LaboratoryRepository.get(account.id);
    expect(oldLaboratory.getUnfinishedResearch()).toBeDefined();
    expect(oldLaboratory.getUnrewardedResearch()).toBeUndefined();
    const request = new Request('http://localhost:3000/play/solve-problems', {
      method: 'POST',
    });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });
    const laboratory = await LaboratoryRepository.get(account.id);
    expect(laboratory.getUnfinishedResearch()).toBeUndefined();
    expect(laboratory.getUnrewardedResearch()).toBeDefined();
  });
});