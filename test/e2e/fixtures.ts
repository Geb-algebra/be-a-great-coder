import { test as base } from '@playwright/test';
import { username, googleProfileId } from './consts.ts';
import { AccountFactory, AccountRepository } from '~/accounts/lifecycle/account.server.ts';
import { getSession, sessionStorage } from '~/services/session.server.ts';
import { authenticator } from '~/services/auth.server.ts';
import { parse } from 'cookie';

import { resetDB } from 'test/utils.ts';
import invariant from 'tiny-invariant';
import { prisma } from '~/db.server.ts';

export const test = base.extend({
  // Extend the base test with a new "login" method.
  pageWithUser: async ({ page }, use) => {
    const account = await AccountFactory.create({
      name: username,
      googleProfileId: 'testGoogleProfileId',
    });
    await AccountRepository.save(account);
    await use(page);
    await resetDB();
  },
  loggedInPage: async ({ page, baseURL }, use) => {
    // referred to https://github.com/kentcdodds/kentcdodds.com/blob/main/e2e/utils.ts
    invariant(baseURL, 'baseURL is required playwright config');
    const { authenticators, ...user } = await AccountFactory.create({
      name: username,
      googleProfileId: googleProfileId,
    });
    await AccountRepository.save({ authenticators, ...user });
    const session = await getSession(new Request(baseURL));
    // how sessions are set is from https://github.com/sergiodxa/remix-auth/blob/main/src/strategy.ts
    session.set(authenticator.sessionKey, user);
    session.set(authenticator.sessionStrategyKey, 'google');

    const { __session } = parse(await sessionStorage.commitSession(session));
    await page.context().addCookies([
      {
        name: '__session',
        sameSite: 'Lax',
        url: baseURL,
        httpOnly: true,
        secure: false,
        value: __session,
      },
    ]);
    await use(page);
    await resetDB();
    // I wanna logout here
  },
});

test.beforeEach(async () => {
  await resetDB();
});

test.afterAll(async () => {
  await resetDB();
  await prisma.$disconnect();
});

export { expect } from '@playwright/test';
