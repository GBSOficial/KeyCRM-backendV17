import { prisma } from "../database/prisma";

export class BoardServices {
  async create(data: { name: string }) {
    return prisma.board.create({ data });
  }

  async findMany() {
    return prisma.board.findMany({ include: { lists: true } });
  }

  async findOne(id: number) {
    return prisma.board.findUnique({ where: { id }, include: { lists: true } });
  }

  async update(id: number, data: { name?: string }) {
    return prisma.board.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.board.delete({ where: { id } });
  }
} 