import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";
import { NotificationServices } from "./notification.services";
import { TProjectTask, TProjectTaskUpdate, ProjectTaskStatus } from "../schemas/projectTask.schema";

const prisma = new PrismaClient();

const VALID_STATUS = ["A_FAZER", "EM_PROGRESSO", "EM_REVISAO", "CONCLUIDO"];

export class ProjectTaskServices {
  async create(data: TProjectTask) {
    try {
      // Validar status
      if (!VALID_STATUS.includes(data.status)) {
        throw new AppError(400, "Status inválido");
      }

      const projectTask = await prisma.projectTask.create({
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          assignedToId: data.assignedToId || null, // Pode ser null
          order: data.order || null,
          estimatedDays: data.estimatedDays || null
        },
        include: {
          project: {
            include: {
              client: true
            }
          },
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

      // Disparar notificação apenas se houver usuário atribuído
      if (projectTask.assignedToId) {
        const notificationServices = new NotificationServices();
        await notificationServices.create({
          title: "Nova Tarefa de Projeto Atribuída",
          message: `Você foi atribuído à tarefa: ${projectTask.title} do projeto ${projectTask.project.title}`,
          userId: projectTask.assignedToId
        });
      }

      return projectTask;
    } catch (error) {
      console.error('Erro ao criar tarefa de projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao criar tarefa de projeto");
    }
  }

  async findByProject(projectId: number) {
    try {
      const tasks = await prisma.projectTask.findMany({
        where: { projectId },
        include: {
          project: {
            include: {
              client: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ]
      });
      return tasks;
    } catch (error) {
      console.error('Erro ao buscar tarefas do projeto:', error);
      throw new AppError(500, "Erro ao buscar tarefas do projeto");
    }
  }

  async findOne(id: number) {
    try {
      const projectTask = await prisma.projectTask.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              client: true
            }
          },
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

      if (!projectTask) {
        throw new AppError(404, "Tarefa de projeto não encontrada");
      }

      return projectTask;
    } catch (error) {
      console.error('Erro ao buscar tarefa de projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao buscar tarefa de projeto");
    }
  }

  async update(id: number, data: TProjectTaskUpdate) {
    try {
      // Validar status se estiver sendo atualizado
      if (data.status && !VALID_STATUS.includes(data.status)) {
        throw new AppError(400, "Status inválido");
      }

      const projectTask = await prisma.projectTask.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
          order: data.order !== undefined ? data.order : undefined,
          estimatedDays: data.estimatedDays !== undefined ? data.estimatedDays : undefined
        },
        include: {
          project: {
            include: {
              client: true
            }
          },
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

      // Se o status foi alterado ou usuário foi atribuído, criar uma notificação
      if (data.status || (data.assignedToId && projectTask.assignedToId)) {
        const notificationServices = new NotificationServices();
        
        if (data.status) {
          await notificationServices.create({
            title: "Status da Tarefa de Projeto Atualizado",
            message: `A tarefa "${projectTask.title}" foi movida para ${data.status}`,
            userId: projectTask.assignedToId!
          });
        }
        
        if (data.assignedToId && projectTask.assignedToId) {
          await notificationServices.create({
            title: "Nova Tarefa de Projeto Atribuída",
            message: `Você foi atribuído à tarefa: ${projectTask.title} do projeto ${projectTask.project.title}`,
            userId: projectTask.assignedToId
          });
        }
      }

      return projectTask;
    } catch (error) {
      console.error('Erro ao atualizar tarefa de projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao atualizar tarefa de projeto");
    }
  }

  async updateStatus(id: number, status: ProjectTaskStatus) {
    try {
      if (!VALID_STATUS.includes(status)) {
        throw new AppError(400, "Status inválido");
      }

      const projectTask = await prisma.projectTask.update({
        where: { id },
        data: { status },
        include: {
          project: {
            include: {
              client: true
            }
          },
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

      // Notificar apenas se houver usuário atribuído
      if (projectTask.assignedToId) {
        const notificationServices = new NotificationServices();
        await notificationServices.create({
          title: "Status da Tarefa de Projeto Atualizado",
          message: `A tarefa "${projectTask.title}" foi movida para ${status}`,
          userId: projectTask.assignedToId
        });
      }

      return projectTask;
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa de projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao atualizar status da tarefa de projeto");
    }
  }

  async delete(id: number) {
    try {
      const projectTask = await prisma.projectTask.findUnique({
        where: { id }
      });

      if (!projectTask) {
        throw new AppError(404, "Tarefa de projeto não encontrada");
      }

      await prisma.projectTask.delete({
        where: { id }
      });

      return { message: "Tarefa de projeto excluída com sucesso" };
    } catch (error) {
      console.error('Erro ao excluir tarefa de projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao excluir tarefa de projeto");
    }
  }

  // Novos métodos para trabalhar com departamentos

  async findByDepartment(department: string, projectId?: number) {
    try {
      const whereClause: any = { department };
      
      if (projectId) {
        whereClause.projectId = projectId;
      }

      const tasks = await prisma.projectTask.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              client: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao buscar tarefas por departamento:', error);
      throw new AppError(500, "Erro ao buscar tarefas por departamento");
    }
  }

  async assignToUser(taskId: number, userId: number) {
    try {
      const task = await this.update(taskId, { assignedToId: userId });
      return task;
    } catch (error) {
      console.error('Erro ao atribuir tarefa a usuário:', error);
      throw new AppError(500, "Erro ao atribuir tarefa a usuário");
    }
  }

  async unassignFromUser(taskId: number) {
    try {
      const task = await this.update(taskId, { assignedToId: null });
      return task;
    } catch (error) {
      console.error('Erro ao desatribuir tarefa de usuário:', error);
      throw new AppError(500, "Erro ao desatribuir tarefa de usuário");
    }
  }

  // ===== NOVOS MÉTODOS PARA MÚLTIPLAS ATRIBUIÇÕES =====

  /**
   * Adiciona múltiplas atribuições a uma tarefa
   */
  async addMultipleAssignments(taskId: number, userIds: number[], assignedBy?: number) {
    try {
      const task = await prisma.projectTask.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new AppError(404, "Tarefa não encontrada");
      }

      // Criar atribuições para cada usuário
      const assignments = await Promise.all(
        userIds.map(userId => 
          prisma.projectTaskAssignment.upsert({
            where: {
              projectTaskId_userId: {
                projectTaskId: taskId,
                userId: userId
              }
            },
            update: {
              status: 'ACTIVE',
              assignedBy: assignedBy
            },
            create: {
              projectTaskId: taskId,
              userId: userId,
              assignedBy: assignedBy,
              status: 'ACTIVE'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  img: true,
                  department: true
                }
              }
            }
          })
        )
      );

      // Criar notificações para os usuários atribuídos
      const notificationServices = new NotificationServices();
      await Promise.all(
        userIds.map(userId =>
          notificationServices.create({
            title: "Nova Tarefa Atribuída",
            message: `Você foi atribuído à tarefa: ${task.title}`,
            userId: userId
          })
        )
      );

      return assignments;
    } catch (error) {
      console.error('Erro ao adicionar múltiplas atribuições:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao adicionar múltiplas atribuições");
    }
  }

  /**
   * Remove uma atribuição específica
   */
  async removeAssignment(taskId: number, userId: number) {
    try {
      const assignment = await prisma.projectTaskAssignment.update({
        where: {
          projectTaskId_userId: {
            projectTaskId: taskId,
            userId: userId
          }
        },
        data: {
          status: 'REMOVED'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          projectTask: {
            select: {
              title: true
            }
          }
        }
      });

      return assignment;
    } catch (error) {
      console.error('Erro ao remover atribuição:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao remover atribuição");
    }
  }

  /**
   * Busca tarefas com todas as atribuições
   */
  async findByDepartmentWithAssignments(department: string, projectId?: number) {
    try {
      const whereClause: any = { department };
      
      if (projectId) {
        whereClause.projectId = projectId;
      }

      const tasks = await prisma.projectTask.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              client: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          assignments: {
            where: {
              status: 'ACTIVE'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  img: true,
                  department: true
                }
              },
              assignedByUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          autoAssignments: true
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao buscar tarefas com atribuições:', error);
      throw new AppError(500, "Erro ao buscar tarefas com atribuições");
    }
  }

  /**
   * Configura pré-atribuição automática por departamento
   */
  async setupAutoAssignment(taskId: number, departments: string[]) {
    try {
      const task = await prisma.projectTask.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new AppError(404, "Tarefa não encontrada");
      }

      // Criar auto-atribuições para cada departamento
      const autoAssignments = await Promise.all(
        departments.map(department =>
          prisma.projectTaskAutoAssignment.upsert({
            where: {
              projectTaskId_department: {
                projectTaskId: taskId,
                department: department
              }
            },
            update: {
              autoAssigned: false // Reset para reprocessar
            },
            create: {
              projectTaskId: taskId,
              department: department,
              autoAssigned: false
            }
          })
        )
      );

      return autoAssignments;
    } catch (error) {
      console.error('Erro ao configurar auto-atribuição:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao configurar auto-atribuição");
    }
  }

  /**
   * Processa auto-atribuições pendentes
   */
  async processAutoAssignments(taskId: number) {
    try {
      // Buscar auto-atribuições pendentes
      const autoAssignments = await prisma.projectTaskAutoAssignment.findMany({
        where: {
          projectTaskId: taskId,
          autoAssigned: false
        }
      });

      if (autoAssignments.length === 0) {
        return [];
      }

      const results = [];

      for (const autoAssignment of autoAssignments) {
        // Buscar usuários do departamento
        const users = await prisma.user.findMany({
          where: {
            department: autoAssignment.department,
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        });

        if (users.length > 0) {
          // Atribuir automaticamente a todos os usuários do departamento
          const userIds = users.map(user => user.id);
          await this.addMultipleAssignments(taskId, userIds);

          // Marcar como processado
          await prisma.projectTaskAutoAssignment.update({
            where: { id: autoAssignment.id },
            data: { autoAssigned: true }
          });

          results.push({
            department: autoAssignment.department,
            usersAssigned: users.length,
            users: users
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao processar auto-atribuições:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao processar auto-atribuições");
    }
  }

  /**
   * Busca usuários atribuídos a uma tarefa
   */
  async getTaskAssignments(taskId: number) {
    try {
      const assignments = await prisma.projectTaskAssignment.findMany({
        where: {
          projectTaskId: taskId,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true,
              department: true
            }
          },
          assignedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          assignedAt: 'asc'
        }
      });

      return assignments;
    } catch (error) {
      console.error('Erro ao buscar atribuições da tarefa:', error);
      throw new AppError(500, "Erro ao buscar atribuições da tarefa");
    }
  }
} 