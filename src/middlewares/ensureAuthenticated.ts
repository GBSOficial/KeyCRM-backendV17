import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { prisma } from '../database/prismaClient';

interface IPayload {
  id: number;
  offices: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
    userRoles?: any[];
    userPermissions?: any[];
    roles?: string[];
    permissions?: string[];
  };
}

export class ValidateToken {
  static async execute(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token não fornecido'
      });
    }

    const [, token] = authHeader.split(' ');

    try {
      const { id: userId, offices, email } = verify(token, process.env.JWT_SECRET || 'default_secret') as IPayload;

      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId)
        },
        select: {
          id: true,
          name: true,
          email: true,
          offices: true,
          department: true,
          status: true,
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          },
          userPermissions: {
            where: {
              granted: true
            },
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        
        return res.status(401).json({
          error: 'Usuário não encontrado'
        });
      }

      // Verificar se o usuário ainda está ativo
      if (user.status === 'INACTIVE') {
        return res.status(403).json({
          error: 'Conta de usuário inativa. Entre em contato com o administrador.'
        });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          error: 'Conta de usuário suspensa. Entre em contato com o administrador.'
        });
      }
      // Extrair roles e permissões
      const roles = user.userRoles.map(ur => ur.role.name);
      const rolePermissions = user.userRoles.flatMap(ur => 
        ur.role.rolePermissions.map(rp => rp.permission.key)
      );
      const directPermissions = user.userPermissions.map(up => up.permission.key);
      const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

      const authReq = req as AuthRequest;
      authReq.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        offices: user.offices,
        department: user.department,
        userRoles: user.userRoles,
        userPermissions: user.userPermissions,
        roles: roles,
        permissions: allPermissions
      };

      return next();
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
  }
}

// Export adicional para compatibilidade
export const ensureAuthenticated = ValidateToken.execute; 