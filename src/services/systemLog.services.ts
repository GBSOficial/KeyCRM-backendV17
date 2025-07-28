import { prisma } from '../database/prismaClient';
import { Request } from 'express';

export interface CreateLogData {
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  action: string;
  message: string;
  details?: any;
  userId?: number;
  targetId?: string;
  targetType?: string;
  req?: Request;
}

export class SystemLogService {
  /**
   * Cria um log no sistema
   */
  static async createLog(data: CreateLogData) {
    try {
      const logData = {
        level: data.level,
        action: data.action,
        message: data.message,
        details: data.details ? JSON.stringify(data.details) : null,
        userId: data.userId,
        targetId: data.targetId,
        targetType: data.targetType,
        ipAddress: data.req?.ip || data.req?.socket?.remoteAddress || null,
        userAgent: data.req?.get('User-Agent') || null
      };

      const log = await prisma.systemLog.create({
        data: logData
      });

      return log;
    } catch (error) {
      console.error('Erro ao criar log:', error);
      // Não falha a operação principal se o log falhar
    }
  }

  /**
   * Busca logs com paginação e filtros
   */
  static async getLogs(page = 1, limit = 50, filters?: {
    level?: string;
    action?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (filters) {
        if (filters.level) where.level = filters.level;
        if (filters.action) where.action = filters.action;
        if (filters.userId) where.userId = filters.userId;
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = filters.startDate;
          if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
      }

      const logs = await prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const total = await prisma.systemLog.count({ where });

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  }

  /**
   * Logs de ações específicas
   */
  static async logUserLogin(userId: number, req?: Request) {
    return this.createLog({
      level: 'SUCCESS',
      action: 'LOGIN',
      message: 'Usuário fez login no sistema',
      userId,
      req
    });
  }

  static async logUserLogout(userId: number, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'LOGOUT',
      message: 'Usuário fez logout do sistema',
      userId,
      req
    });
  }

  static async logUserCreated(createdUserId: number, createdByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'CREATE_USER',
      message: 'Novo usuário criado no sistema',
      userId: createdByUserId,
      targetId: createdUserId.toString(),
      targetType: 'USER',
      req
    });
  }

  static async logUserUpdated(updatedUserId: number, updatedByUserId?: number, changes?: any, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'UPDATE_USER',
      message: 'Usuário atualizado',
      details: changes,
      userId: updatedByUserId,
      targetId: updatedUserId.toString(),
      targetType: 'USER',
      req
    });
  }

  static async logUserDeleted(deletedUserId: number, deletedByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'WARN',
      action: 'DELETE_USER',
      message: 'Usuário removido do sistema',
      userId: deletedByUserId,
      targetId: deletedUserId.toString(),
      targetType: 'USER',
      req
    });
  }

  static async logUserStatusChanged(userId: number, newStatus: string, changedByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'CHANGE_USER_STATUS',
      message: `Status do usuário alterado para ${newStatus}`,
      userId: changedByUserId,
      targetId: userId.toString(),
      targetType: 'USER',
      details: { newStatus },
      req
    });
  }

  static async logPasswordReset(userId: number, resetByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'WARN',
      action: 'RESET_PASSWORD',
      message: 'Senha do usuário resetada',
      userId: resetByUserId,
      targetId: userId.toString(),
      targetType: 'USER',
      req
    });
  }

  static async logLeadCreated(leadId: number, createdByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'CREATE_LEAD',
      message: 'Novo lead criado',
      userId: createdByUserId,
      targetId: leadId.toString(),
      targetType: 'LEAD',
      req
    });
  }

  static async logLeadUpdated(leadId: number, updatedByUserId?: number, changes?: any, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'UPDATE_LEAD',
      message: 'Lead atualizado',
      details: changes,
      userId: updatedByUserId,
      targetId: leadId.toString(),
      targetType: 'LEAD',
      req
    });
  }

  static async logProjectCreated(projectId: number, createdByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'CREATE_PROJECT',
      message: 'Novo projeto criado',
      userId: createdByUserId,
      targetId: projectId.toString(),
      targetType: 'PROJECT',
      req
    });
  }

  static async logTaskCreated(taskId: number, createdByUserId?: number, req?: Request) {
    return this.createLog({
      level: 'INFO',
      action: 'CREATE_TASK',
      message: 'Nova tarefa criada',
      userId: createdByUserId,
      targetId: taskId.toString(),
      targetType: 'TASK',
      req
    });
  }

  static async logError(error: Error, userId?: number, req?: Request) {
    return this.createLog({
      level: 'ERROR',
      action: 'SYSTEM_ERROR',
      message: `Erro no sistema: ${error.message}`,
      details: {
        stack: error.stack,
        name: error.name
      },
      userId,
      req
    });
  }

  static async logSecurityAlert(message: string, userId?: number, req?: Request) {
    return this.createLog({
      level: 'WARN',
      action: 'SECURITY_ALERT',
      message,
      userId,
      req
    });
  }
} 