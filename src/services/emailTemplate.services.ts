import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class EmailTemplateServices {
  async create(data: {
    name: string;
    subject: string;
    content: string;
    category?: string;
    createdById: number;
  }) {
    return prisma.emailTemplate.create({
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
    filters?: { category?: string; isActive?: boolean }, 
    userId?: number, 
    userOffices?: string, 
    showAllTemplates?: boolean
  ) {
    const where: any = {};
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Aplicar filtro de permissão:
    // Se não for diretor OU não estiver vendo todos, mostrar apenas templates do próprio usuário
    const isDirector = userOffices === 'Diretor';
    if (!isDirector || !showAllTemplates) {
      where.createdById = userId;
    }

    return prisma.emailTemplate.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id: number) {
    return prisma.emailTemplate.findUnique({
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

  async update(id: number, data: Partial<{
    name: string;
    subject: string;
    content: string;
    category: string;
    isActive: boolean;
  }>) {
    return prisma.emailTemplate.update({
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
    return prisma.emailTemplate.delete({
      where: { id }
    });
  }

  async getCategories() {
    const categories = await prisma.emailTemplate.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    });
    
    return categories.map(c => c.category);
  }
} 