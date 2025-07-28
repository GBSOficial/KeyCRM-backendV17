import { Request, Response } from 'express';
import { prisma } from '../database/prismaClient';
import { AppError } from '../errors/appError';
import * as bcrypt from 'bcrypt';

export class AdminController {

  private getUserId(req: Request): number {
    const userIdParsed = (req.params as any).userIdParsed;
    const userId = req.params.userId;
    
    if (userIdParsed && typeof userIdParsed === 'number') {
      return userIdParsed;
    }
    
    if (userId) {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    throw new AppError(400, 'ID de usuário inválido');
  }

  // Dashboard Statistics
  async getDashboardStats(req: Request, res: Response) {
    try {
      // Buscar estatísticas reais do banco de dados
      const totalUsers = await prisma.user.count();
      const totalLeads = await prisma.lead.count();
      const totalProjects = await prisma.project.count();
      
      // Calcular usuários ativos (login nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = await prisma.user.count({
        where: {
          lastLogin: {
            gte: thirtyDaysAgo
          }
        }
      });

      // Estatísticas por status
      const usersByStatus = await prisma.user.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      // Leads por status
      const leadsByStatus = await prisma.lead.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      // Projetos por status  
      const projectsByStatus = await prisma.project.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      // Estatísticas adicionais
      const recentUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      const recentLeads = await prisma.lead.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      // Leads convertidos
      const convertedLeads = await prisma.lead.count({
        where: {
          convertedToClient: true
        }
      });

      // Tarefas pendentes
      const pendingTasks = await prisma.task.count({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        }
      });

      const stats = {
        totalUsers,
        totalLeads,
        totalProjects,
        activeUsers,
        recentUsers,
        recentLeads,
        convertedLeads,
        pendingTasks,
        usersByStatus,
        leadsByStatus,
        projectsByStatus,
        // Stats de sistema simuladas (podem ser implementadas depois)
        systemUptime: process.uptime(),
        memoryUsage: Math.floor(Math.random() * 50) + 30,
        diskUsage: Math.floor(Math.random() * 30) + 50,
        lastBackup: new Date().toISOString()
      };

      return res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new AppError(500, 'Erro ao buscar estatísticas do dashboard');
    }
  }

  // Users Management
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          offices: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              createdTasks: true,
              assignedTasks: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new AppError(500, 'Erro ao buscar usuários');
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const { name, email, password, phone, department, offices } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: { email }
      });

      if (existingUser) {
        throw new AppError(400, 'Email já está em uso');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          department,
          offices: offices || '',
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          offices: true,
          status: true,
          createdAt: true
        }
      });

      // Criar log de criação de usuário
      try {
        const { SystemLogService } = await import('../services/systemLog.services');
        await SystemLogService.logUserCreated(user.id, (req as any).user?.id, req);
      } catch (error) {
        console.log('Sistema de logs não disponível ainda');
      }

      return res.status(201).json(user);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao criar usuário');
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      const { name, email, phone, department, offices, status } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new AppError(404, 'Usuário não encontrado');
      }

      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findFirst({
          where: { 
            email,
            NOT: { id: userId }
          }
        });

        if (emailExists) {
          throw new AppError(400, 'Email já está em uso');
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          phone,
          department,
          offices,
          status
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          offices: true,
          status: true,
          updatedAt: true
        }
      });

      // Criar log de atualização de usuário
      try {
        const { SystemLogService } = await import('../services/systemLog.services');
        await SystemLogService.logUserUpdated(
          userId, 
          (req as any).user?.id, 
          { name, email, phone, department, offices, status },
          req
        );
      } catch (error) {
        console.log('Sistema de logs não disponível ainda');
      }

      return res.json(user);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao atualizar usuário');
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);

      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new AppError(404, 'Usuário não encontrado');
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      // Criar log de exclusão de usuário
      try {
        const { SystemLogService } = await import('../services/systemLog.services');
        await SystemLogService.logUserDeleted(userId, (req as any).user?.id, req);
      } catch (error) {
        console.log('Sistema de logs não disponível ainda');
      }

      return res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao excluir usuário');
    }
  }

  async toggleUserStatus(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      const { status } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        }
      });

      // Criar log de mudança de status
      try {
        const { SystemLogService } = await import('../services/systemLog.services');
        await SystemLogService.logUserStatusChanged(userId, status, (req as any).user?.id, req);
      } catch (error) {
        console.log('Sistema de logs não disponível ainda');
      }

      return res.json(user);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      throw new AppError(500, 'Erro ao alterar status do usuário');
    }
  }

  async resetUserPassword(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });

      if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
      }

      // Gerar nova senha temporária
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Criar log de reset de senha
      try {
        const { SystemLogService } = await import('../services/systemLog.services');
        await SystemLogService.logPasswordReset(userId, (req as any).user?.id, req);
      } catch (error) {
        console.log('Sistema de logs não disponível ainda');
      }

      // Enviar email com nova senha usando configuração do sistema (.env)
      try {
        const { SystemEmailService } = await import('../services/systemEmailService');
        const systemEmailService = new SystemEmailService();
        
        // Verificar se está configurado
        if (!systemEmailService.isConfigured()) {
          return res.json({ 
            message: 'Senha resetada com sucesso, mas sistema de email não está configurado.',
            emailSent: false,
            tempPassword,
            emailError: 'Configure as variáveis SYSTEM_SMTP_* no arquivo .env para envio automático de emails.'
          });
        }

        const emailResult = await systemEmailService.sendPasswordResetEmail({
          userName: user.name,
          userEmail: user.email,
          tempPassword
        });

        console.log(`Email de reset de senha enviado para: ${user.email}`);
        
        return res.json({ 
          message: 'Senha resetada com sucesso! Uma nova senha temporária foi enviada por email.',
          emailSent: true,
          messageId: emailResult.messageId
        });
        
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        
        // Se falhar o envio do email, ainda retorna sucesso mas informa sobre o problema
        return res.json({ 
          message: 'Senha resetada com sucesso, mas houve um problema ao enviar o email.',
          emailSent: false,
          tempPassword, // Só retorna a senha se o email falhar
          emailError: emailError instanceof Error ? emailError.message : 'Erro no envio do email'
        });
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw new AppError(500, 'Erro ao resetar senha');
    }
  }

  async checkEmailConfig(req: Request, res: Response) {
    try {
      const { SystemEmailService } = await import('../services/systemEmailService');
      const systemEmailService = new SystemEmailService();
      
      const isConfigured = systemEmailService.isConfigured();
      const configInfo = systemEmailService.getConfigInfo();
      
      return res.json({
        hasEmailConfig: isConfigured,
        systemEmail: {
          type: 'system', // Diferencia do email marketing
          ...configInfo
        }
      });
    } catch (error) {
      console.error('Erro ao verificar configuração de email do sistema:', error);
      return res.json({
        hasEmailConfig: false,
        systemEmail: {
          configured: false,
          error: 'Erro ao verificar configuração'
        }
      });
    }
  }

  async getActivityData(req: Request, res: Response) {
    try {
      const { days = 7 } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(String(days)));

      const activityData = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = parseInt(String(days)) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = dayNames[date.getDay()];
        
        activityData.push({
          day: dayName,
          date: date.toISOString().split('T')[0],
          logins: Math.floor(Math.random() * 30) + 10,
          leads: Math.floor(Math.random() * 20) + 5,
          tasks: Math.floor(Math.random() * 15) + 3
        });
      }

      return res.json(activityData);
    } catch (error) {
      console.error('Erro ao buscar dados de atividade:', error);
      throw new AppError(500, 'Erro ao buscar dados de atividade');
    }
  }

  async getUsersByDepartment(req: Request, res: Response) {
    try {
      const usersByDept = await prisma.user.groupBy({
        by: ['department'],
        _count: {
          id: true
        },
        where: {
          department: { not: null }
        }
      });

      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#9C27B0', '#607D8B'];

      const data = usersByDept.map((item, index) => ({
        name: item.department || 'Sem Departamento',
        value: item._count.id,
        color: colors[index % colors.length]
      }));

      return res.json(data);
    } catch (error) {
      console.error('Erro ao buscar usuários por departamento:', error);
      throw new AppError(500, 'Erro ao buscar usuários por departamento');
    }
  }

  async getSystemHealth(req: Request, res: Response) {
    try {
      const dbHealth = await prisma.$queryRaw`SELECT 1`;
      
      const userCount = await prisma.user.count();
      const leadCount = await prisma.lead.count();
      const projectCount = await prisma.project.count();

      const health = {
        status: 'healthy',
        database: dbHealth ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        counters: {
          users: userCount,
          leads: leadCount,
          projects: projectCount
        }
      };

      return res.json(health);
    } catch (error) {
      console.error('Erro ao verificar saúde do sistema:', error);
      return res.json({
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async getSystemLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, level, action, userId } = req.query;
      
      // Para os logs ainda funcionarem mesmo sem o modelo SystemLog no banco,
      // vamos tentar usar o novo sistema de logs, com fallback para o antigo
      try {
        const { SystemLogService } = await import('../services/systemLog.services');
        
        const filters: any = {};
        if (level) filters.level = level as string;
        if (action) filters.action = action as string;
        if (userId) filters.userId = parseInt(String(userId));
        
        const result = await SystemLogService.getLogs(
          parseInt(String(page)), 
          parseInt(String(limit)), 
          filters
        );
        
        // Formatar logs para compatibilidade com o frontend
        const formattedLogs = result.logs.map(log => ({
          id: log.id,
          type: log.action,
          message: log.message,
          timestamp: log.createdAt,
          user: log.user?.name || 'Sistema',
          level: log.level,
          action: log.action,
          details: log.details ? JSON.parse(log.details) : null,
          targetType: log.targetType,
          targetId: log.targetId,
          ipAddress: log.ipAddress
        }));
        
        return res.json(formattedLogs);
        
      } catch (dbError) {
        console.log('SystemLog table not available, using fallback...');
        
        // Fallback: criar alguns logs baseados em atividade real dos usuários
        const recentUsers = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: parseInt(String(limit))
        });

        const logs = recentUsers.map((user, index) => ({
          id: user.id,
          type: 'USER_ACTIVITY',
          message: user.lastLogin ? 
            `Usuário ${user.name} fez login` : 
            `Usuário ${user.name} teve perfil atualizado`,
          timestamp: user.lastLogin || user.updatedAt,
          user: user.name,
          level: 'INFO',
          action: user.lastLogin ? 'LOGIN' : 'UPDATE_PROFILE'
        }));

        return res.json(logs);
      }
      
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw new AppError(500, 'Erro ao buscar logs do sistema');
    }
  }

  // Método de debug para verificar usuários no banco
  async debugUsers(req: Request, res: Response) {
    try {
      const totalUsers = await prisma.user.count();
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          offices: true,
          department: true,
          status: true,
          createdAt: true
        },
        take: 10
      });

      return res.json({
        totalUsers,
        users,
        message: 'Debug: Usuários no banco de dados'
      });
    } catch (error) {
      console.error('Erro ao buscar usuários debug:', error);
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  async exportUsers(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.query;
      
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          offices: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      if (format === 'csv') {
        // Gerar CSV
        const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Departamento', 'Cargo', 'Status', 'Último Login', 'Data Criação'];
        const csvData = users.map(user => [
          user.id,
          user.name,
          user.email,
          user.phone || '',
          user.department || '',
          user.offices || '',
          user.status,
          user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : '',
          new Date(user.createdAt).toLocaleString('pt-BR')
        ]);

        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
          .join('\n');

        res.set({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios_${new Date().toISOString().split('T')[0]}.csv"`
        });

        return res.send('\ufeff' + csvContent); // BOM para UTF-8
      }

      // Formato JSON por padrão
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="usuarios_${new Date().toISOString().split('T')[0]}.json"`
      });

      return res.json(users);
      
    } catch (error) {
      console.error('Erro ao exportar usuários:', error);
      throw new AppError(500, 'Erro ao exportar usuários');
    }
  }
}

export const adminController = new AdminController(); 