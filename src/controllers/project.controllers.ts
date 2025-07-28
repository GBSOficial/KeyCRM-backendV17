import { Request, Response } from "express";
import { ProjectServices } from "../services/project.services";
import { createProjectSchema, updateProjectSchema } from "../schemas/project.schema";
import { AppError } from "../errors/appError";

interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export class ProjectControllers {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const validatedData = createProjectSchema.parse(req.body);
      const project = await projectServices.create(validatedData);
      return res.status(201).json(project);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findMany(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Buscar projetos que o usuário tem acesso
      const projects = await projectServices.findProjectsByUserAccess(userId);
      return res.json(projects);
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findOne(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;
      const project = await projectServices.findOne(Number(id));
      return res.json(project);
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;
      const validatedData = updateProjectSchema.parse(req.body);
      const project = await projectServices.update(Number(id), validatedData);
      return res.json(project);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;
      await projectServices.delete(Number(id));
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findByClient(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { clientId } = req.params;
      const projects = await projectServices.findByClient(Number(clientId));
      return res.json(projects);
    } catch (error) {
      console.error('Erro ao listar projetos do cliente:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ===== NOVOS MÉTODOS PARA ATRIBUIÇÕES DE USUÁRIOS =====

  async assignUsersToProject(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;
      const { userIds } = req.body;
      const assignedBy = req.user?.id;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'Lista de usuários é obrigatória' });
      }

      const assignments = await projectServices.assignUsersToProject(
        Number(id), 
        userIds, 
        assignedBy
      );

      return res.json(assignments);
    } catch (error) {
      console.error('Erro ao atribuir usuários ao projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async removeUserFromProject(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id, userId } = req.params;

      const assignment = await projectServices.removeUserFromProject(
        Number(id), 
        Number(userId)
      );

      return res.json(assignment);
    } catch (error) {
      console.error('Erro ao remover usuário do projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getProjectAssignments(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;

      const assignments = await projectServices.getProjectAssignments(Number(id));

      return res.json(assignments);
    } catch (error) {
      console.error('Erro ao buscar atribuições do projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAllTaskAssignments(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;

      const assignments = await projectServices.getAllTaskAssignments(Number(id));

      return res.json(assignments);
    } catch (error) {
      console.error('Erro ao buscar atribuições de tarefas do projeto:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async checkProjectAccess(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const hasAccess = await projectServices.hasProjectAccess(Number(id), userId);

      return res.json({ hasAccess });
    } catch (error) {
      console.error('Erro ao verificar acesso ao projeto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // MÉTODO TEMPORÁRIO PARA ATRIBUIR USUÁRIOS ESPECÍFICOS
  async assignSpecificUsers(req: Request, res: Response): Promise<Response> {
    try {
      const projectServices = new ProjectServices();
      
      // Buscar o projeto do biel@email.com
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Buscar usuários
      const bielUser = await prisma.user.findFirst({
        where: { email: 'biel@email.com' }
      });
      
      const biel2User = await prisma.user.findFirst({
        where: { email: 'biel2@email.com' }
      });
      
      const biel3User = await prisma.user.findFirst({
        where: { email: 'biel3@email.com' }
      });
      
      if (!bielUser || !biel2User || !biel3User) {
        return res.status(404).json({ 
          error: 'Usuários não encontrados',
          found: {
            biel: !!bielUser,
            biel2: !!biel2User,
            biel3: !!biel3User
          }
        });
      }
      
      // Buscar projeto do biel
      const project = await prisma.project.findFirst({
        where: {
          client: {
            userId: bielUser.id
          }
        },
        include: {
          client: true
        }
      });
      
      if (!project) {
        return res.status(404).json({ error: 'Projeto do biel@email.com não encontrado' });
      }
      
      // Atribuir biel2 e biel3 ao projeto
      const assignments = await projectServices.assignUsersToProject(
        project.id,
        [biel2User.id, biel3User.id],
        bielUser.id
      );
      
      await prisma.$disconnect();
      
      return res.json({
        message: 'Usuários atribuídos com sucesso!',
        project: {
          id: project.id,
          title: project.title,
          client: project.client.name
        },
        assignments: assignments.map(a => ({
          userId: a.user.id,
          userName: a.user.name,
          userEmail: a.user.email
        }))
      });
    } catch (error) {
      console.error('Erro ao atribuir usuários específicos:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
} 