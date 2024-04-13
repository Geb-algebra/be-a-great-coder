import { type User } from "../models/account.ts";
import { prisma } from "~/db.server.ts";

export class UserRepository {
  static async getById(id: User["id"]) {
    const _user = await prisma.user.findUnique({ where: { id } });
    if (!_user) return null;
    const { createdAt, updatedAt, ...user } = _user;
    return user;
  }

  static async getByName(name: User["name"]) {
    const _user = await prisma.user.findUnique({ where: { name } });
    if (!_user) return null;
    const { createdAt, updatedAt, ...user } = _user;
    return user;
  }

  static async save(user: User) {
    return await prisma.user.update({ where: { id: user.id }, data: user });
  }
}
