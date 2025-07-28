import { Request, Response } from "express";
import { ProjectTaskServices } from "../services/projectTask.services";
import { ProjectTaskTemplateServices } from "../services/projectTaskTemplate.services";
import { projectTaskSchema, ProjectTaskStatus } from "../schemas/projectTask.schema";

interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export class ProjectTaskControllers {
  private projectTaskServices = new ProjectTaskServices();
  private templateServices = new ProjectTaskTemplateServices();

  create = async (req: AuthRequest, res: Response) => {
    try {

      const { projectId } = req.params;
      const taskData = {
        ...req.body,
        projectId: parseInt(projectId)
      };


      const validatedData = projectTaskSchema.parse(taskData);

      const projectTask = await this.projectTaskServices.create(validatedData);

      res.status(201).json(projectTask);
    } catch (error: any) {
      console.error('Erro no controller create:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors
        });
      }

      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  findByProject = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const tasks = await this.projectTaskServices.findByProject(parseInt(projectId));

      res.json(tasks);
    } catch (error: any) {
      console.error('Erro no controller findByProject:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  findOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = await this.projectTaskServices.findOne(parseInt(id));
      res.json(task);
    } catch (error: any) {
      console.error('Erro no controller findOne:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = await this.projectTaskServices.update(parseInt(id), req.body);
      res.json(task);
    } catch (error: any) {
      console.error('Erro no controller update:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors
        });
      }

      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const task = await this.projectTaskServices.updateStatus(parseInt(id), status as ProjectTaskStatus);
      res.json(task);
    } catch (error: any) {
      console.error('Erro no controller updateStatus:', error);
      const statusCode = error.message.includes('não encontrada') ? 404 : 500;
      res.status(statusCode).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.projectTaskServices.delete(parseInt(id));
      res.json(result);
    } catch (error: any) {
      console.error('Erro no controller delete:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  // Novos métodos para departamentos

  findByDepartment = async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      const { projectId } = req.query;
      
      const tasks = await this.projectTaskServices.findByDepartment(
        department, 
        projectId ? parseInt(projectId as string) : undefined
      );
      
      res.json(tasks);
    } catch (error: any) {
      console.error('Erro no controller findByDepartment:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  assignToUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const task = await this.projectTaskServices.assignToUser(parseInt(id), userId);
      res.json(task);
    } catch (error: any) {
      console.error('Erro no controller assignToUser:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  unassignFromUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const task = await this.projectTaskServices.unassignFromUser(parseInt(id));
      res.json(task);
    } catch (error: any) {
      console.error('Erro no controller unassignFromUser:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  getUsersByDepartment = async (req: Request, res: Response) => {
    try {
      const usersByDepartment = await this.templateServices.getUsersByDepartment();
      res.json(usersByDepartment);
    } catch (error: any) {
      console.error('Erro no controller getUsersByDepartment:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  getUsersFromDepartment = async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      const users = await this.templateServices.getUsersFromDepartment(department);
      res.json(users);
    } catch (error: any) {
      console.error('Erro no controller getUsersFromDepartment:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  getDepartmentStats = async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      
      const stats = await this.templateServices.getDepartmentStats(department);
      res.json(stats);
    } catch (error: any) {
      console.error('Erro no controller getDepartmentStats:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  getAllDepartments = async (req: Request, res: Response) => {
    try {
      const departments = this.templateServices.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      console.error('Erro no controller getAllDepartments:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  // ===== NOVOS MÉTODOS PARA MÚLTIPLAS ATRIBUIÇÕES =====

  addMultipleAssignments = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      const assignedBy = req.user?.id;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          error: "Lista de usuários é obrigatória"
        });
      }

      const assignments = await this.projectTaskServices.addMultipleAssignments(
        parseInt(id), 
        userIds, 
        assignedBy
      );

      res.json(assignments);
    } catch (error: any) {
      console.error('Erro no controller addMultipleAssignments:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  removeAssignment = async (req: Request, res: Response) => {
    try {
      const { id, userId } = req.params;

      const assignment = await this.projectTaskServices.removeAssignment(
        parseInt(id), 
        parseInt(userId)
      );

      res.json(assignment);
    } catch (error: any) {
      console.error('Erro no controller removeAssignment:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  findByDepartmentWithAssignments = async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      const { projectId } = req.query;
      
      const tasks = await this.projectTaskServices.findByDepartmentWithAssignments(
        department, 
        projectId ? parseInt(projectId as string) : undefined
      );
      
      res.json(tasks);
    } catch (error: any) {
      console.error('Erro no controller findByDepartmentWithAssignments:', error);
      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  setupAutoAssignment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { departments } = req.body;

      if (!Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({
          error: "Lista de departamentos é obrigatória"
        });
      }

      const autoAssignments = await this.projectTaskServices.setupAutoAssignment(
        parseInt(id), 
        departments
      );

      res.json(autoAssignments);
    } catch (error: any) {
      console.error('Erro no controller setupAutoAssignment:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  processAutoAssignments = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const results = await this.projectTaskServices.processAutoAssignments(parseInt(id));

      res.json({
        message: "Auto-atribuições processadas com sucesso",
        results: results
      });
    } catch (error: any) {
      console.error('Erro no controller processAutoAssignments:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  getTaskAssignments = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const assignments = await this.projectTaskServices.getTaskAssignments(parseInt(id));

      res.json(assignments);
    } catch (error: any) {
      console.error('Erro no controller getTaskAssignments:', error);
      const status = error.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };

  // Método para criar tarefa com auto-atribuições
  createWithAutoAssignments = async (req: AuthRequest, res: Response) => {
    try {
      const { autoAssignDepartments, ...taskData } = req.body;

      // Criar a tarefa primeiro
      const task = await this.projectTaskServices.create(taskData);

      // Se há departamentos para auto-atribuição, configurar
      if (autoAssignDepartments && Array.isArray(autoAssignDepartments) && autoAssignDepartments.length > 0) {
        await this.projectTaskServices.setupAutoAssignment(task.id, autoAssignDepartments);
        await this.projectTaskServices.processAutoAssignments(task.id);
      }

      // Buscar a tarefa com todas as atribuições
      const taskWithAssignments = await this.projectTaskServices.findByDepartmentWithAssignments(
        task.department,
        task.projectId
      );

      const createdTask = taskWithAssignments.find(t => t.id === task.id);

      res.status(201).json(createdTask || task);
    } catch (error: any) {
      console.error('Erro no controller createWithAutoAssignments:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors
        });
      }

      res.status(500).json({
        error: error.message || "Erro interno do servidor"
      });
    }
  };
} 