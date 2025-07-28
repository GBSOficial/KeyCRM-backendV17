import { prisma } from "../database/prisma";

export class ListServices {
  async create(data: { name: string; order: number; boardId: number }) {
    return prisma.list.create({ data });
  }

  async findManyByBoard(boardId: number) {
    return prisma.list.findMany({ where: { boardId }, include: { cards: true } });
  }

  async findOne(id: number) {
    return prisma.list.findUnique({ where: { id }, include: { cards: true } });
  }

  async update(id: number, data: { name?: string; order?: number }) {
    return prisma.list.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.list.delete({ where: { id } });
  }
} 