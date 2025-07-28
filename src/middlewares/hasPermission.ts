import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
    userRoles?: any[];
    userPermissions?: any[];
  };
}

// Cache de permissões do usuário (evita consultas desnecessárias)
const userPermissionsCache = new Map<number, { permissions: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca todas as permissões efetivas do usuário (roles + permissões diretas)
 */
async function getUserPermissions(userId: number): Promise<string[]> {
  // Verificar cache
  const cached = userPermissionsCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.permissions;
  }

  try {
    // Buscar permissões via roles
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          userRoles: {
            some: { userId }
          }
        }
      },
      include: {
        permission: true
      }
    });

    // Buscar permissões diretas do usuário
    const directPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        granted: true
      },
      include: {
        permission: true
      }
    });

    // Combinar todas as permissões
    const allPermissions = [
      ...rolePermissions.map(rp => rp.permission.key),
      ...directPermissions.map(up => up.permission.key)
    ];

    // Remover duplicatas
    const uniquePermissions = [...new Set(allPermissions)];

    // Atualizar cache
    userPermissionsCache.set(userId, {
      permissions: uniquePermissions,
      timestamp: Date.now()
    });

    return uniquePermissions;
  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error);
    return [];
  }
}

/**
 * Middleware para verificar se o usuário tem uma permissão específica
 */
export function hasPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
      const userPermissions = await getUserPermissions(authReq.user.id);
      
      if (userPermissions.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({ 
        error: `Acesso negado. Permissão necessária: ${requiredPermission}`,
        required: requiredPermission,
        userPermissions: userPermissions // Para debug (remover em produção)
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para verificar se o usuário tem pelo menos uma das permissões
 */
export function hasAnyPermission(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
      const userPermissions = await getUserPermissions(authReq.user.id);
      
      const hasAnyRequired = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (hasAnyRequired) {
        return next();
      }

      return res.status(403).json({ 
        error: `Acesso negado. Uma das permissões necessárias: ${requiredPermissions.join(', ')}`,
        required: requiredPermissions,
        userPermissions: userPermissions // Para debug (remover em produção)
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para verificar se o usuário tem todas as permissões
 */
export function hasAllPermissions(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
      const userPermissions = await getUserPermissions(authReq.user.id);
      
      const hasAllRequired = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (hasAllRequired) {
        return next();
      }

      const missingPermissions = requiredPermissions.filter(permission => 
        !userPermissions.includes(permission)
      );

      return res.status(403).json({ 
        error: `Acesso negado. Permissões em falta: ${missingPermissions.join(', ')}`,
        missing: missingPermissions,
        userPermissions: userPermissions // Para debug (remover em produção)
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para verificar se o usuário tem um role específico
 */
export function hasRole(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId: authReq.user.id },
        include: { role: true }
      });

      const hasRequiredRole = userRoles.some(ur => ur.role.name === requiredRole);

      if (hasRequiredRole) {
        return next();
      }

      return res.status(403).json({ 
        error: `Acesso negado. Role necessário: ${requiredRole}`,
        required: requiredRole,
        userRoles: userRoles.map(ur => ur.role.name) // Para debug (remover em produção)
      });
    } catch (error) {
      console.error('Erro ao verificar roles:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Função utilitária para verificar permissões sem middleware
 */
export async function checkUserPermission(userId: number, permission: string): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions.includes(permission);
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Limpar cache de permissões (útil quando permissões do usuário mudam)
 */
export function clearUserPermissionsCache(userId?: number) {
  if (userId) {
    userPermissionsCache.delete(userId);
  } else {
    userPermissionsCache.clear();
  }
}

// Middlewares de compatibilidade (mantém compatibilidade com sistema antigo)
export const ensureDirector = hasAnyPermission(['admin_access', 'admin_users']);
export const ensureImplantacao = hasPermission('implantacao_access');
export const ensureAdmin = hasPermission('admin_access'); 