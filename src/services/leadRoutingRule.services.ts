import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class LeadRoutingRuleServices {
  async create(data: {
    pageId: string;
    formId: string;
    destination: string;
    description?: string;
    createdById: number;
  }) {
    return prisma.leadRoutingRule.create({ data });
  }

  async findAll() {
    return prisma.leadRoutingRule.findMany({
      include: { createdBy: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id: number) {
    return prisma.leadRoutingRule.findUnique({ where: { id }, include: { createdBy: true } });
  }

  async update(id: number, data: Partial<{ pageId: string; formId: string; destination: string; description: string; }>) {
    return prisma.leadRoutingRule.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.leadRoutingRule.delete({ where: { id } });
  }
} 