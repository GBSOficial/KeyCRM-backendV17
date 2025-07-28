import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.services';
import { AppError } from '../errors/appError';

interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export class PermissionController {
  private permissionService = new PermissionService();

  // ===== PERMISSÕES =====
  
  async getAllPermissions(req: Request, res: Response) {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      
      // Agrupar por módulo
      const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      }, {} as Record<string, any[]>);

      return res.json({
        permissions,
        groupedPermissions
      });
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createPermission(req: Request, res: Response) {
    try {
      const { key, name, description, module } = req.body;

      if (!key || !name || !module) {
        return res.status(400).json({ 
          error: 'Chave, nome e módulo são obrigatórios' 
        });
      }

      const permission = await this.permissionService.createPermission({
        key,
        name,
        description,
        module
      });

      return res.status(201).json(permission);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao criar permissão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ===== ROLES/FUNÇÕES =====
  
  async getAllRoles(req: Request, res: Response) {
    try {
      const roles = await this.permissionService.getAllRoles();
      return res.json(roles);
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const { name, description, color, permissionIds } = req.body;

      if (!name) {
        return res.status(400).json({ 
          error: 'Nome da função é obrigatório' 
        });
      }

      const role = await this.permissionService.createRole({
        name,
        description,
        color,
        permissionIds
      });

      return res.status(201).json(role);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao criar função:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, color, permissionIds } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ 
          error: 'ID da função é obrigatório e deve ser um número' 
        });
      }

      console.log('🔧 Atualizando role:', id, { name, description, color, permissionIds });

      const role = await this.permissionService.updateRole(Number(id), {
        name,
        description,
        color,
        permissionIds
      });

      console.log('✅ Role atualizada com sucesso:', role);
      return res.json(role);
    } catch (error) {
      if (error instanceof AppError) {
        console.error('❌ Erro de aplicação:', error.message);
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('❌ Erro ao atualizar função:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ===== ATRIBUIÇÕES DE USUÁRIO =====
  
  async getUserPermissions(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ 
          error: 'ID do usuário é obrigatório e deve ser um número' 
        });
      }

      const userPermissions = await this.permissionService.getUserPermissions(Number(userId));
      return res.json(userPermissions);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao buscar permissões do usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async assignRoleToUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      const authReq = req as AuthRequest;
      const assignedBy = authReq.user?.id;

      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ 
          error: 'ID do usuário é obrigatório e deve ser um número' 
        });
      }

      if (!roleId || isNaN(Number(roleId))) {
        return res.status(400).json({ 
          error: 'ID da função é obrigatório e deve ser um número' 
        });
      }

      if (!assignedBy) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      const assignment = await this.permissionService.assignRoleToUser(
        Number(userId),
        Number(roleId),
        assignedBy
      );

      return res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao atribuir função ao usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async removeRoleFromUser(req: Request, res: Response) {
    try {
      const { userId, roleId } = req.params;

      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ 
          error: 'ID do usuário é obrigatório e deve ser um número' 
        });
      }

      if (!roleId || isNaN(Number(roleId))) {
        return res.status(400).json({ 
          error: 'ID da função é obrigatório e deve ser um número' 
        });
      }

      await this.permissionService.removeRoleFromUser(
        Number(userId),
        Number(roleId)
      );

      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao remover função do usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ===== VERIFICAÇÃO DE PERMISSÕES =====
  
  async checkUserPermission(req: Request, res: Response) {
    try {
      const { userId, permissionKey } = req.params;

      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ 
          error: 'ID do usuário é obrigatório e deve ser um número' 
        });
      }

      if (!permissionKey) {
        return res.status(400).json({ 
          error: 'Chave da permissão é obrigatória' 
        });
      }

      const hasPermission = await this.permissionService.checkUserPermission(
        Number(userId),
        permissionKey
      );

      return res.json({ hasPermission });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao verificar permissão do usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ===== INICIALIZAÇÃO DO SISTEMA =====
  
  async initializeSystem(req: Request, res: Response) {
    try {
      const result = await this.permissionService.initializeSystemPermissions();
      return res.json(result);
    } catch (error) {
      console.error('Erro ao inicializar sistema de permissões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ===== ESTATÍSTICAS =====
  
  async getPermissionStats(req: Request, res: Response) {
    try {
      const permissions = await this.permissionService.getAllPermissions();
      const roles = await this.permissionService.getAllRoles();

      const stats = {
        totalPermissions: permissions.length,
        totalRoles: roles.length,
        systemRoles: roles.filter(r => r.isSystem).length,
        customRoles: roles.filter(r => !r.isSystem).length,
        moduleStats: permissions.reduce((acc, permission) => {
          acc[permission.module] = (acc[permission.module] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        usersWithRoles: roles.reduce((total, role) => total + role.userRoles.length, 0)
      };

      return res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
} 