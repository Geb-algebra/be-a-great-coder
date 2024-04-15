import { createId } from "@paralleldrive/cuid2";
import { type User } from "@prisma/client";

import { prisma } from "~/db.server.ts";
import { isUsernameAvailable } from "~/services/auth.server.ts";
import type { Account, Authenticator } from "../models/account.ts";

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
    googleProfileId = null,
    authenticators = [],
  }: {
    name: User["name"];
    id?: User["id"];
    googleProfileId?: User["googleProfileId"];
    authenticators?: Authenticator[];
  }): Promise<Account> {
    if (!(await isUsernameAvailable(name))) {
      throw new Error("username already taken");
    }
    return {
      id: id ?? (await this.generateId()),
      name,
      googleProfileId,
      authenticators,
    };
  }
}

export class AccountRepository {
  private static async _get(
    where: { id: User["id"] } | { name: User["name"] },
  ): Promise<Account | null> {
    const accountRecord = await prisma.user.findUnique({
      where,
      include: {
        authenticators: true,
      },
    });
    if (!accountRecord) return null;
    const { authenticators, ...user } = accountRecord;
    const account: Account = {
      ...user,
      authenticators: authenticators.map((authenticator) => ({
        ...authenticator,
        transports: authenticator.transports.split(","),
      })),
    };
    return account;
  }

  static async getById(id: Account["id"]) {
    return await this._get({ id });
  }

  static async getByName(name: Account["name"]) {
    return await this._get({ name });
  }

  static async getByGoogleProfileId(googleProfileId: Account["googleProfileId"]) {
    const accountRecord = await prisma.user.findFirst({
      where: {
        googleProfileId,
      },
      include: {
        authenticators: true,
      },
    });
    if (!accountRecord) return null;
    const { authenticators, ...user } = accountRecord;
    const account: Account = {
      ...user,
      authenticators: authenticators.map((authenticator) => ({
        ...authenticator,
        transports: authenticator.transports.split(","),
      })),
    };
    return account;
  }

  static async save(account: Account) {
    const { authenticators, ...user } = account;
    await prisma.$transaction(async (prisma) => {
      await prisma.user.upsert({
        where: { id: account.id },
        update: user,
        create: user,
      });
      const newAuthenticators = authenticators.map((a) => ({
        ...a,
        transports: a.transports.join(","),
      }));
      const existingAuthenticators = await prisma.authenticator.findMany({
        where: { userId: account.id },
      });
      const deletingAuthenticators = existingAuthenticators.filter(
        (a) => !newAuthenticators.find((na) => na.credentialID === a.credentialID),
      );
      await prisma.authenticator.deleteMany({
        where: { credentialID: { in: deletingAuthenticators.map((a) => a.credentialID) } },
      });
      const creatingAuthenticators = newAuthenticators.filter(
        (a) => !existingAuthenticators.find((ea) => ea.credentialID === a.credentialID),
      );
      for (const a of creatingAuthenticators) {
        await prisma.authenticator.create({ data: { ...a, userId: account.id } });
      }
      const updatingAuthenticators = newAuthenticators.filter((a) =>
        existingAuthenticators.find((ea) => ea.credentialID === a.credentialID),
      );
      for (const a of updatingAuthenticators) {
        await prisma.authenticator.update({ where: { credentialID: a.credentialID }, data: a });
      }
    });
  }
}
