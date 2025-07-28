import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";
import { CreateProject, UpdateProject } from "../schemas/project.schema";
import { ProjectTaskTemplateServices } from "./projectTaskTemplate.services";

const prisma = new PrismaClient();

export class ProjectServices {
  async create(data: CreateProject) {
    try {
      // Verificar se o cliente existe
      const client = await prisma.client.findUnique({
        where: { id: data.clientId }
      });

      if (!client) {
        throw new AppError(404, "Cliente não encontrado");
      }

      // Converter datas se fornecidas
      const projectData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      };

      const project = await prisma.project.create({
        data: projectData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              marca: true
            }
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  img: true
                }
              }
            }
          }
        }
      });

      // Criar automaticamente as tarefas do template de implantação
      const templateServices = new ProjectTaskTemplateServices();
      await templateServices.createTasksFromTemplate(project.id);

      return project;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao criar projeto");
    }
  }

  async findMany() {
    try {
      const projects = await prisma.project.findMany({
        include: {
          client: true,
          projectTasks: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return projects;
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      throw new AppError(500, "Erro ao buscar projetos");
    }
  }

  async findOne(id: number) {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              marca: true
            }
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  img: true
                }
              }
            }
          }
        }
      });

      if (!project) {
        throw new AppError(404, "Projeto não encontrado");
      }

      return project;
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao buscar projeto");
    }
  }

  async update(id: number, data: UpdateProject) {
    try {
      // Verificar se o projeto existe
      const existingProject = await prisma.project.findUnique({
        where: { id }
      });

      if (!existingProject) {
        throw new AppError(404, "Projeto não encontrado");
      }

      // Se está mudando o cliente, verificar se o novo cliente existe
      if (data.clientId && data.clientId !== existingProject.clientId) {
        const client = await prisma.client.findUnique({
          where: { id: data.clientId }
        });

        if (!client) {
          throw new AppError(404, "Cliente não encontrado");
        }
      }

      // Converter datas se fornecidas
      const updateData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      };

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              marca: true
            }
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  img: true
                }
              }
            }
          }
        }
      });

      return project;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao atualizar projeto");
    }
  }

  async delete(id: number) {
    try {
      // Verificar se o projeto existe
      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          tasks: true
        }
      });

      if (!existingProject) {
        throw new AppError(404, "Projeto não encontrado");
      }

      // Verificar se há tarefas associadas
      if (existingProject.tasks.length > 0) {
        throw new AppError(400, "Não é possível excluir projeto com tarefas associadas");
      }

      await prisma.project.delete({
        where: { id }
      });

      return { message: "Projeto excluído com sucesso" };
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao excluir projeto");
    }
  }

  async findByClient(clientId: number) {
    try {
      const projects = await prisma.project.findMany({
        where: { clientId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              marca: true
            }
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  img: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return projects;
    } catch (error) {
      console.error('Erro ao listar projetos do cliente:', error);
      throw new AppError(500, "Erro ao listar projetos do cliente");
    }
  }

  // ===== NOVOS MÉTODOS PARA ATRIBUIÇÕES DE USUÁRIOS AOS PROJETOS =====

  /**
   * Atribui usuários a um projeto
   */
  async assignUsersToProject(projectId: number, userIds: number[], assignedBy?: number) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new AppError(404, "Projeto não encontrado");
      }

      // Criar atribuições para cada usuário
      const assignments = await Promise.all(
        userIds.map(userId => 
          prisma.projectUserAssignment.upsert({
            where: {
              projectId_userId: {
                projectId: projectId,
                userId: userId
              }
            },
            update: {
              status: 'ACTIVE',
              assignedBy: assignedBy
            },
            create: {
              projectId: projectId,
              userId: userId,
              assignedBy: assignedBy,
              status: 'ACTIVE',
              role: 'MEMBER'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true
                }
              }
            }
          })
        )
      );

      return assignments;
    } catch (error) {
      console.error('Erro ao atribuir usuários ao projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao atribuir usuários ao projeto");
    }
  }

  /**
   * Remove atribuição de usuário do projeto
   */
  async removeUserFromProject(projectId: number, userId: number) {
    try {
      const assignment = await prisma.projectUserAssignment.update({
        where: {
          projectId_userId: {
            projectId: projectId,
            userId: userId
          }
        },
        data: {
          status: 'REMOVED'
        }
      });

      return assignment;
    } catch (error) {
      console.error('Erro ao remover usuário do projeto:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao remover usuário do projeto");
    }
  }

  /**
   * Busca usuários atribuídos a um projeto
   */
  async getProjectAssignments(projectId: number) {
    try {
      const assignments = await prisma.projectUserAssignment.findMany({
        where: {
          projectId: projectId,
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              img: true
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
      console.error('Erro ao buscar atribuições do projeto:', error);
      throw new AppError(500, "Erro ao buscar atribuições do projeto");
    }
  }

  /**
   * Busca o projectId de uma tarefa
   */
  async getProjectIdFromTask(taskId: number) {
    try {
      const task = await prisma.projectTask.findUnique({
        where: { id: taskId },
        select: { projectId: true }
      });

      return task?.projectId || null;
    } catch (error) {
      console.error('Erro ao buscar projectId da tarefa:', error);
      return null;
    }
  }

  /**
   * Verifica se um usuário tem acesso a um projeto
   */
  async hasProjectAccess(projectId: number, userId: number) {
    try {
      // Verificar se é o dono do cliente do projeto
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true
        }
      });

      if (!project) {
        return false;
      }

      // Se é o consultor responsável pelo cliente
      if (project.client.userId === userId) {
        return true;
      }

      // Verificar se está atribuído ao projeto
      const assignment = await prisma.projectUserAssignment.findFirst({
        where: {
          projectId: projectId,
          userId: userId,
          status: 'ACTIVE'
        }
      });

      return !!assignment;
    } catch (error) {
      console.error('Erro ao verificar acesso ao projeto:', error);
      return false;
    }
  }

  /**
   * Busca projetos que o usuário tem acesso
   */
  async findProjectsByUserAccess(userId: number) {
    try {
      // Buscar projetos onde o usuário é consultor do cliente
      const ownProjects = await prisma.project.findMany({
        where: {
          client: {
            userId: userId
          }
        },
        include: {
          client: true,
          projectTasks: {
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      // Buscar projetos onde o usuário está atribuído
      const assignedProjects = await prisma.project.findMany({
        where: {
          projectAssignments: {
            some: {
              userId: userId,
              status: 'ACTIVE'
            }
          }
        },
        include: {
          client: true,
          projectTasks: {
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      // Combinar e remover duplicatas
      const allProjects = [...ownProjects, ...assignedProjects];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      );

      return uniqueProjects.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Erro ao buscar projetos do usuário:', error);
      throw new AppError(500, "Erro ao buscar projetos do usuário");
    }
  }

  /**
   * Busca todas as atribuições de tarefas de um projeto
   */
  async getAllTaskAssignments(projectId: number) {
    try {
      const assignments = await prisma.projectTaskAssignment.findMany({
        where: {
          projectTask: {
            projectId: projectId
          },
          status: 'ACTIVE'
        },
        select: {
          id: true,
          projectTaskId: true,
          assignedAt: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true,
              department: true
            }
          },
          projectTask: {
            select: {
              id: true,
              title: true
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
      console.error('Erro ao buscar atribuições de tarefas do projeto:', error);
      throw new AppError(500, "Erro ao buscar atribuições de tarefas do projeto");
    }
  }
} 