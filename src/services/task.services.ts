import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";
import { NotificationServices } from "./notification.services";
import { TTask, TTaskUpdate } from "../schemas/task.schema";

const prisma = new PrismaClient();

const VALID_STATUS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export class TaskServices {
  async create(data: TTask) {
    try {
      // Validar status
      if (!VALID_STATUS.includes(data.status)) {
        throw new AppError(400, "Status inválido");
      }

      const task = await prisma.task.create({
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : null
        },
        include: {
          lead: true,
          project: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        }
      });

      // Buscar informações do criador da tarefa se não veio no include
      let creatorName = 'Sistema';
      if (data.createdById) {
        if (task.createdBy) {
          creatorName = task.createdBy.name;
        } else {
          // Fallback caso o include não funcione
          const creator = await prisma.user.findUnique({
            where: { id: data.createdById },
            select: { name: true }
          });
          creatorName = creator?.name || 'Sistema';
        }
      }

      // Disparar notificação para o usuário atribuído com informação de quem criou
      if (task.assignedToId) {
        const notificationServices = new NotificationServices();
        await notificationServices.create({
          title: "Nova Tarefa Atribuída",
          message: `${creatorName} criou uma tarefa para você: ${task.title}${task.description ? '\n\n' + task.description : ''}`,
          userId: task.assignedToId
        });
      }

      return task;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao criar tarefa");
    }
  }

  async findMany(filters: { leadId?: number; assignedToId?: number; status?: string; userId?: number; viewAll?: string | boolean; department?: string }) {
    try {
      const where: any = {};
      
      // Verifica se o usuário tem permissão para ver todas as tasks
      const userOffices = await prisma.user.findUnique({
        where: { id: filters.userId },
        select: { offices: true }
      });

      const allowedOffices = ['Diretor'];
      const userOfficesArray = Array.isArray(userOffices?.offices) 
        ? userOffices.offices 
        : [userOffices?.offices];
      const canSeeAllTasks = userOfficesArray.some(office => allowedOffices.includes(office));

      // Converte viewAll para boolean
      const shouldViewAll = filters.viewAll === true || filters.viewAll === 'true';

      // Filtro por departamento - para Master Office (MF)
      if (filters.department) {
        where.assignedTo = {
          department: filters.department
        };
      } else {
        // Se não for diretor ou não estiver solicitando ver todas as tasks, filtra por assignedToId
        if (!canSeeAllTasks || !shouldViewAll) {
          where.assignedToId = filters.userId;
        }
      }      
      if (filters.leadId) {
        where.leadId = filters.leadId;
      }
      
      if (filters.status) {
        if (!VALID_STATUS.includes(filters.status)) {
          throw new AppError(400, "Status inválido");
        }
        where.status = filters.status;
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          lead: true,
          project: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true,
              offices: true,
              department: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao listar tarefas");
    }
  }

  async findOne(id: number) {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          lead: true,
          project: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        }
      });

      if (!task) {
        throw new AppError(404, "Tarefa não encontrada");
      }

      return task;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar tarefa:', error);
      throw new AppError(500, "Erro ao buscar tarefa");
    }
  }

  async update(id: number, data: TTaskUpdate) {
    try {
      // Validar status se estiver sendo atualizado
      if (data.status && !VALID_STATUS.includes(data.status)) {
        throw new AppError(400, "Status inválido");
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined
        },
        include: {
          lead: true,
          project: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        }
      });

      // Se o status foi alterado, criar uma notificação
      if (data.status) {
        const notificationServices = new NotificationServices();
        await notificationServices.create({
          title: "Status da Tarefa Atualizado",
          message: `A tarefa "${task.title}" foi movida para ${data.status}`,
          userId: task.assignedToId
        });
      }

      return task;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao atualizar tarefa");
    }
  }

  async delete(id: number) {
    try {
      await prisma.task.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      throw new AppError(500, "Erro ao excluir tarefa");
    }
  }

  async findByLead(leadId: number) {
    try {
      const tasks = await prisma.task.findMany({
        where: { leadId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao listar tarefas do lead:', error);
      throw new AppError(500, "Erro ao listar tarefas do lead");
    }
  }

  async findByProject(projectId: number) {
    try {
      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          project: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao listar tarefas do projeto:', error);
      throw new AppError(500, "Erro ao listar tarefas do projeto");
    }
  }
} 