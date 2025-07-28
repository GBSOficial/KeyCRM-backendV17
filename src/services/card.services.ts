import { prisma } from "../database/prisma";

export class CardServices {
  async create(data: { title: string; description?: string; order: number; listId: number }) {
    return prisma.card.create({ data });
  }

  async findManyByList(listId: number) {
    return prisma.card.findMany({ where: { listId } });
  }

  async findOne(id: number) {
    return prisma.card.findUnique({ where: { id } });
  }

  async update(id: number, data: { title?: string; description?: string; order?: number; listId?: number }) {
    return prisma.card.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.card.delete({ where: { id } });
  }
} 