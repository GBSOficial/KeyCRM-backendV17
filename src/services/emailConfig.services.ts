import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export class EmailConfigServices {
  async create(data: {
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
    isDefault?: boolean;
    createdById: number;
  }) {
    // Se esta configuração for marcada como padrão, desmarcar as outras
    if (data.isDefault) {
      await prisma.emailConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return prisma.emailConfig.create({
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findAll(
    filters?: { isActive?: boolean }, 
    userId?: number, 
    userOffices?: string, 
    showAllConfigs?: boolean
  ) {
    const where: any = {};
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Aplicar filtro de permissão:
    // Se não for diretor OU não estiver vendo todos, mostrar apenas configs do próprio usuário
    const isDirector = userOffices === 'Diretor';
    if (!isDirector || !showAllConfigs) {
      where.createdById = userId;
    }

    return prisma.emailConfig.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            offices: true
          }
        },
        _count: {
          select: {
            emailSends: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findById(id: number) {
    return prisma.emailConfig.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findDefault() {
    return prisma.emailConfig.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    });
  }

  async update(id: number, data: Partial<{
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
    isDefault: boolean;
    isActive: boolean;
  }>) {
    // Se esta configuração for marcada como padrão, desmarcar as outras
    if (data.isDefault) {
      await prisma.emailConfig.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    return prisma.emailConfig.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async delete(id: number) {
    return prisma.emailConfig.delete({
      where: { id }
    });
  }

  async testConnection(configData: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
  }) {
    try {
      const transporter = nodemailer.createTransport({
        host: configData.host,
        port: configData.port,
        secure: configData.secure,
        auth: {
          user: configData.username,
          pass: configData.password
        },
        connectionTimeout: 30000, // 30 segundos
        greetingTimeout: 30000,   // 30 segundos
        socketTimeout: 30000      // 30 segundos
      });

      await transporter.verify();
      return { success: true, message: "Conexão testada com sucesso!" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { 
        success: false, 
        message: `Erro na conexão: ${errorMessage}` 
      };
    }
  }
} 