import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class NotificationServices {
  async create(data: { title: string; message: string; userId: number }) {
    return prisma.notification.create({ data });
  }

  async findMany(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(id: number, userId: number) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  }
} 