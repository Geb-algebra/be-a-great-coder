import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { AccountRepository } from '~/accounts/models/account.server.ts';
import { authenticator } from '~/accounts/services/auth.server.ts';
import { getRequiredStringFromFormData } from '~/utils/utils.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/play/settings',
    failureRedirect: '/',
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/' });
  const account = await AccountRepository.getById(user.id);
  const formData = await request.formData();
  const method = request.method.toLowerCase();

  const passkeyId = getRequiredStringFromFormData(formData, 'passkey-id');
  invariant(['put', 'delete'].includes(method), 'Method must be one of put, delete');

  if (method === 'put') {
    const name = getRequiredStringFromFormData(formData, 'passkey-name');
    const passkey = account.authenticators.find((a) => a.credentialID === passkeyId);
    invariant(passkey, 'Passkey must exist');
    passkey.name = name;
    await AccountRepository.save(account);
  } else if (method === 'delete') {
    if (account.authenticators.length === 1) {
      // TODO: consider google auth
      return json({ errorMessage: 'You must have at least one passkey' }, { status: 400 });
    }
    account.authenticators = account.authenticators.filter((a) => a.credentialID !== passkeyId);
    await AccountRepository.save(account);
  }
  return redirect('/play/settings');
}
