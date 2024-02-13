import { createId } from '@paralleldrive/cuid2';
import { type User } from '@prisma/client';

import { prisma } from '~/db.server.ts';
import type { Authenticator } from '~/models/authenticator.server.ts';
import { isUsernameAvailable } from '~/services/auth.server.ts';

export type { User } from '@prisma/client';

export type Account = User & {
  authenticators: Authenticator[];
};

export class AccountFactory {
  static async generateId() {
    return createId();
  }

  /**
   * Create a user with the given name and id.
   * @param name
   * @param id optional, if not provided, will generate a random id
   * @returns the created user
   * @throws Error if username already taken
   */
  static async create({
    name,
    id,
    googleProfileId,
    authenticators = [],
  }: {
    name: User['name'];
    id?: User['id'];
    googleProfileId?: User['googleProfileId'];
    authenticators?: Authenticator[];
  }): Promise<Account> {
    if (!(await isUsernameAvailable(name))) {
      throw new Error('username already taken');
    }
    const user = await prisma.user.create({
      data: {
        id: id ?? (await this.generateId()),
        name,
        googleProfileId,
      },
    });
    for (const authenticator of authenticators) {
      await prisma.authenticator.create({
        data: {
          ...authenticator,
          transports: authenticator.transports.join(','),
          userId: user.id,
        },
      });
    }
    return await AccountRepository.getById(user.id);
  }
}

export class AccountRepository {
  private static async _get(where: { id: User['id'] } | { name: User['name'] }): Promise<Account> {
    const accountRecord = await prisma.user.findUnique({
      where,
      include: {
        authenticators: true,
      },
    });
    if (!accountRecord) throw new Error('User not found');
    const { authenticators, ...user } = accountRecord;
    const account: Account = {
      ...user,
      authenticators: authenticators.map((authenticator) => ({
        ...authenticator,
        transports: authenticator.transports.split(','),
      })),
    };
    return account;
  }

  static async getById(id: Account['id']): Promise<Account> {
    return await this._get({ id });
  }

  static async getByName(name: Account['name']) {
    return await this._get({ name });
  }

  static async getByGoogleProfileId(googleProfileId: Account['googleProfileId']) {
    const accountRecord = await prisma.user.findFirst({
      where: {
        googleProfileId,
      },
      include: {
        authenticators: true,
      },
    });
    if (!accountRecord) throw new Error('User not found');
    const { authenticators, ...user } = accountRecord;
    const account: Account = {
      ...user,
      authenticators: authenticators.map((authenticator) => ({
        ...authenticator,
        transports: authenticator.transports.split(','),
      })),
    };
    return account;
  }

  protected static async _upsertOrDeleteAuthenticators(
    authenticators: Authenticator[],
    userId: User['id'],
  ) {
    const newAuthenticators = authenticators.map((authenticator) => ({
      ...authenticator,
      transports: authenticator.transports.join(','),
    }));
    const existingAuthenticators = await prisma.authenticator.findMany({
      where: { userId },
    });
    const deletingAuthenticators = existingAuthenticators.filter(
      (authenticator) =>
        !newAuthenticators.find(
          (newAuthenticator) => newAuthenticator.credentialID === authenticator.credentialID,
        ),
    );
    await prisma.authenticator.deleteMany({
      where: {
        credentialID: {
          in: deletingAuthenticators.map((authenticator) => authenticator.credentialID),
        },
      },
    });
    const creatingAuthenticators = newAuthenticators.filter(
      (authenticator) =>
        !existingAuthenticators.find(
          (existingAuthenticator) =>
            existingAuthenticator.credentialID === authenticator.credentialID,
        ),
    );
    for (const authenticator of creatingAuthenticators) {
      await prisma.authenticator.create({
        data: {
          ...authenticator,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
    }
    const updatingAuthenticators = newAuthenticators.filter((authenticator) =>
      existingAuthenticators.find(
        (existingAuthenticator) =>
          existingAuthenticator.credentialID === authenticator.credentialID,
      ),
    );
    for (const authenticator of updatingAuthenticators) {
      await prisma.authenticator.update({
        where: { credentialID: authenticator.credentialID },
        data: authenticator,
      });
    }
  }

  static async save(account: Account) {
    const { authenticators, ...user } = account;
    await this._upsertOrDeleteAuthenticators(authenticators, account.id);
    return await prisma.user.update({
      where: { id: account.id },
      data: user,
    });
  }
}
