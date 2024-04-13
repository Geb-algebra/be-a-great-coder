import { AccountFactory, AccountRepository } from '~/accounts/lifecycle/account.server';
import { getSession, sessionStorage } from '~/services/session.server';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';

/**
 * Sets up an account and add a session to the request.
 * */
export async function setupAccount() {
  const account = await AccountFactory.create({
    name: 'testuser',
    id: 'testid',
  });
  await AccountRepository.save(account);
  return account;
}

/**
 * ! This function mutates the given request instance.
 */
export async function addAuthenticationSessionTo(request: Request) {
  const session = await getSession(request);
  session.set('user', { id: 'testid', name: 'testuser' });
  request.headers.set('cookie', await sessionStorage.commitSession(session));
}

export function authenticated(dataFunction: LoaderFunction | ActionFunction) {
  return async function (
    args: Parameters<typeof dataFunction>[0],
  ): Promise<Awaited<ReturnType<typeof dataFunction>>> {
    await addAuthenticationSessionTo(args.request);
    return dataFunction(args);
  };
}
