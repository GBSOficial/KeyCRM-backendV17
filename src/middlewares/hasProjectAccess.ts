import { Request, Response, NextFunction } from 'express';
import { ProjectServices } from '../services/project.services';

interface AuthRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export const hasProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const { department, offices } = authReq.user;
  const userId = authReq.user.id;
  // Se é do departamento de Implantação ou Diretor, tem acesso total
  if (department === 'IMPLANTACAO' || offices === 'IMPLANTACAO' || 
      department === 'Diretor' || offices === 'Diretor') {
    return next();
  }

  // Para outros usuários, verificar se tem acesso ao projeto específico
  let projectId = req.params.projectId || req.params.id;
  
  // Se a rota é de tarefa (/tasks/:id), precisamos buscar o projectId da tarefa
  if (req.path.includes('/tasks/') && req.params.id && !req.params.projectId) {
    try {
      const projectServices = new ProjectServices();
      const taskProjectId = await projectServices.getProjectIdFromTask(Number(req.params.id));
      if (taskProjectId) {
        projectId = taskProjectId.toString();
      }
    } catch (error) {
      console.error('Erro ao buscar projectId da tarefa:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao verificar permissões.' 
      });
    }
  }
  
  if (!projectId) {
    // Se não há projectId na rota, permitir (pode ser uma rota geral)
    return next();
  }

  try {
    const projectServices = new ProjectServices();
    const hasAccess = await projectServices.hasProjectAccess(Number(projectId), userId);
    
    if (hasAccess) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Acesso negado. Você não tem permissão para acessar este projeto.' 
    });
  } catch (error) {
    console.error('Erro ao verificar acesso ao projeto:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao verificar permissões.' 
    });
  }
}; 