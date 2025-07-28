import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const authorization = req.headers.authorization;

    const token = authorization?.replace("Bearer ","");

    if (!token) {
      throw new AppError(403, "Token is required");
    }

    try {
      // Verifica e decodifica o token em uma única operação
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number;
        offices: string;
        email: string;
      };

      // Garante que os dados necessários estão presentes
      if (!decoded.id || !decoded.offices) {
        throw new AppError(403, "Invalid token payload");
      }

      // Buscar dados completos do usuário incluindo roles e permissões
      const user = await prisma.user.findUnique({
        where: {
          id: Number(decoded.id)
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
        console.error(`Token validation failed: User with ID ${decoded.id} not found in database`);
        throw new AppError(403, "User not found");
      }

      // Verificar se o usuário ainda está ativo
      if (user.status === 'INACTIVE') {
        throw new AppError(403, "User account is inactive. Contact administrator.");
      }

      if (user.status === 'SUSPENDED') {
        throw new AppError(403, "User account is suspended. Contact administrator.");
      }

      // Extrair roles e permissões
      const roles = user.userRoles.map(ur => ur.role.name);
      const rolePermissions = user.userRoles.flatMap(ur => 
        ur.role.rolePermissions.map(rp => rp.permission.key)
      );
      const directPermissions = user.userPermissions.map(up => up.permission.key);
      const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

      // Armazena os dados decodificados para uso nas rotas (compatibilidade)
      res.locals.decode = decoded;

      // Define req.user para compatibilidade com os controllers
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

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(403, "Invalid token");
      }
      throw error;
    }
  }
}
