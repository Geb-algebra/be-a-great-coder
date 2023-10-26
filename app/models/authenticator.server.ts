import { prisma } from '~/db.server.ts';

export type Authenticator = {
  credentialID: string;
  name: string | null;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: number;
  transports: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getAuthenticatorById(id: Authenticator['credentialID']) {
  const _authenticator = await prisma.authenticator.findUnique({ where: { credentialID: id } });
  if (!_authenticator) return null;
  const authenticator = {
    ..._authenticator,
    transports: _authenticator?.transports.split(',') ?? [],
  };
  return authenticator;
}
