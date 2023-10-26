import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs, json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { AccountRepository } from '~/models/account.server.ts';
import {
  authenticator,
  getHashedPassword,
  validatePassword,
  verifyPassword,
} from '~/services/auth.server.ts';
import { getRequiredStringFromFormData } from '~/utils.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/settings',
    failureRedirect: '/welcome',
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/welcome' });
  const formData = await request.formData();
  const method = request.method.toLowerCase();
  invariant(['post', 'put'].includes(method), 'Method must be one of post, put');

  const newPassword = getRequiredStringFromFormData(formData, 'new-password');
  const confirmNewPassword = getRequiredStringFromFormData(formData, 'confirm-new-password');
  if (newPassword !== confirmNewPassword) {
    return json(
      { errorMessage: 'New password and confirm new password must match.' },
      { status: 400 },
    );
  }
  const account = await AccountRepository.getById(user.id);
  if (method === 'put') {
    const oldPassword = getRequiredStringFromFormData(formData, 'old-password');
    if (!(await verifyPassword(oldPassword, account.passwordHash ?? ''))) {
      return json({ errorMessage: 'Old password is incorrect.' }, { status: 400 });
    }
  }
  if (['post', 'put'].includes(method)) {
    try {
      validatePassword(newPassword);
      account.passwordHash = await getHashedPassword(newPassword);
      await AccountRepository.save(account);
    } catch (error) {
      if (error instanceof Error) {
        return json({ errorMessage: error.message }, { status: 400 });
      } else {
        throw error;
      }
    }
  }

  return redirect('/settings');
}
