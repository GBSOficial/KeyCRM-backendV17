import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class WebhookServices {
  async createLead(leadData: {
    name: string;
    email: string;
    phone: string;
    source?: string;
    status: string;
    userId: number;
    notes?: string;
  }) {
    try {
      const lead = await prisma.lead.create({
        data: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          source: leadData.source,
          status: leadData.status,
          userId: leadData.userId,
          notes: leadData.notes
        }
      });

      return lead;
    } catch (error) {
      console.error("Erro ao criar lead:", error);
      throw new Error("Erro ao criar lead");
    }
  }
} 