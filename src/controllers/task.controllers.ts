import { Request, Response } from "express";
import { TaskServices } from "../services/task.services";
import { taskSchema } from "../schemas/task.schema";

interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export class TaskControllers {
  async create(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const validatedData = taskSchema.parse(req.body);
      const task = await taskServices.create(validatedData);
      return res.status(201).json(task);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  }

  async findMany(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const { leadId, assignedToId, status, viewAll, department } = req.query;
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const filters = {
        leadId: leadId ? parseInt(leadId as string) : undefined,
        assignedToId: assignedToId ? parseInt(assignedToId as string) : undefined,
        status: status as string | undefined,
        userId: userId,
        viewAll: viewAll as string | boolean,
        department: department as string | undefined
      };

      const tasks = await taskServices.findMany(filters);
      return res.json(tasks);
    } catch (error: any) {
      console.error('Erro completo:', error);
      return res.status(500).json({ 
        error: 'Erro ao listar tarefas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const task = await taskServices.findOne(parseInt(req.params.id));
      return res.json(task);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const task = await taskServices.update(parseInt(req.params.id), req.body);
      return res.json(task);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await taskServices.delete(parseInt(req.params.id));
      return res.json({ message: 'Tarefa excluída com sucesso' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir tarefa' });
    }
  }

  async findByLead(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const tasks = await taskServices.findByLead(parseInt(req.params.leadId));
      return res.json(tasks);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar tarefas do lead' });
    }
  }

  async findByProject(req: Request, res: Response) {
    try {
      const taskServices = new TaskServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const tasks = await taskServices.findByProject(parseInt(req.params.projectId));
      return res.json(tasks);
    } catch (error: any) {
      console.error('findByProject - Erro:', error);
      return res.status(500).json({ error: 'Erro ao listar tarefas do projeto' });
    }
  }
} 