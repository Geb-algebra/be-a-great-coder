import { createId } from '@paralleldrive/cuid2';
import { type User, type Password } from '@prisma/client';

import { prisma } from '~/db.server.ts';
import type { Authenticator } from '~/models/authenticator.server.ts';
import { isUsernameAvailable } from '~/services/auth.server.ts';

export type { User } from '@prisma/client';

export type Account = User & {
  passwordHash: Password['hash'] | null;
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
    passwordHash,
    authenticators = [],
  }: {
    name: User['name'];
    id?: User['id'];
    passwordHash?: string;
    authenticators?: Authenticator[];
  }): Promise<Account> {
    if (!(await isUsernameAvailable(name))) {
      throw new Error('username already taken');
    }
    const user = await prisma.user.create({
      data: {
        id: id ?? (await this.generateId()),
        name,
      },
    });
    if (passwordHash) {
      await prisma.password.create({
        data: {
          hash: passwordHash,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }
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
        password: true,
        authenticators: true,
      },
    });
    if (!accountRecord) throw new Error('User not found');
    const { password, authenticators, ...user } = accountRecord;
    const account: Account = {
      ...user,
      passwordHash: password?.hash ?? null,
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

  protected static async _upsertOrDeletePassword(passwordHash: string | null, userId: User['id']) {
    if (!passwordHash) {
      // deleteMany can be used as deleteIfExists
      await prisma.password.deleteMany({ where: { userId } });
    } else {
      await prisma.password.upsert({
        where: { userId },
        update: { hash: passwordHash },
        create: { hash: passwordHash, user: { connect: { id: userId } } },
      });
    }
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
    const { passwordHash, authenticators, ...user } = account;
    await this._upsertOrDeletePassword(passwordHash, account.id);
    await this._upsertOrDeleteAuthenticators(authenticators, account.id);
    return await prisma.user.update({
      where: { id: account.id },
      data: user,
    });
  }
}
