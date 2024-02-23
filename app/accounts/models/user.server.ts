import { type User } from '@prisma/client';
import { prisma } from '~/db.server.ts';

export type { User };

export class UserRepository {
  static async getById(id: User['id']) {
    return await prisma.user.findUnique({ where: { id } });
  }

  static async getByName(name: User['name']) {
    return await prisma.user.findUnique({ where: { name } });
  }

  static async save(user: User) {
    return await prisma.user.update({ where: { id: user.id }, data: user });
  }
}
