import { prisma } from '~/db.server.ts';
import type { Authenticator } from '../models/account.ts';

export async function getAuthenticatorById(id: Authenticator['credentialID']) {
  const _authenticator = await prisma.authenticator.findUnique({ where: { credentialID: id } });
  if (!_authenticator) return null;
  const { createdAt, updatedAt, ...a } = _authenticator;
  const authenticator = {
    ...a,
    transports: _authenticator?.transports.split(',') ?? [],
  };
  return authenticator;
}
