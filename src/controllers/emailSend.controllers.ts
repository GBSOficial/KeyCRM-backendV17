import { Request, Response } from "express";
import { EmailSendServices } from "../services/emailSend.services";

const emailSendServices = new EmailSendServices();

export class EmailSendControllers {
  async sendEmail(req: Request, res: Response) {
    try {
      console.log('=== CONTROLLER SEND EMAIL ===');
      console.log('Body recebido:', req.body);
      console.log('User:', req.user);
      
      const { templateId, leadId, configId } = req.body;
      const sentById = req.user?.id;
      
      console.log('Dados extraídos:', { templateId, leadId, configId, sentById });
      
      if (!sentById) {
        console.error('Usuário não autenticado');
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      if (!templateId || !leadId) {
        console.error('Dados obrigatórios faltando:', { templateId, leadId });
        return res.status(400).json({ error: "templateId e leadId são obrigatórios" });
      }
      
      const serviceData = {
        templateId: Number(templateId),
        leadId: Number(leadId),
        sentById,
        configId: configId ? Number(configId) : undefined
      };
      
      console.log('Dados para o serviço:', serviceData);
      
      const result = await emailSendServices.sendEmail(serviceData);
      
      console.log('Resultado do serviço:', result);
      return res.json(result);
    } catch (error) {
      console.error('Erro no controller sendEmail:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
      
      let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      let statusCode = 400;
      
      // Tratar erros específicos de SMTP
      if (error instanceof Error) {
        if (error.message.includes('550 No Such User Here')) {
          errorMessage = 'E-mail de destino não existe. Verifique se o endereço está correto.';
          statusCode = 422; // Unprocessable Entity
        } else if (error.message.includes('EAUTH')) {
          errorMessage = 'Erro de autenticação SMTP. Verifique as credenciais.';
          statusCode = 401;
        } else if (error.message.includes('ECONNECTION')) {
          errorMessage = 'Erro de conexão com o servidor SMTP.';
          statusCode = 503;
        }
      }
      
      return res.status(statusCode).json({ error: errorMessage });
    }
  }

  async sendBulkEmail(req: Request, res: Response) {
    try {
      const { templateId, leadIds, configId } = req.body;
      const sentById = req.user?.id;
      
      if (!sentById) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ error: "Lista de leads é obrigatória" });
      }
      
      const results = await emailSendServices.sendBulkEmail({
        templateId: Number(templateId),
        leadIds: leadIds.map(id => Number(id)),
        sentById,
        configId: configId ? Number(configId) : undefined
      });
      
      return res.json(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { leadId, templateId, status, sentById, showAll } = req.query;
      const userId = req.user?.id;
      const userOffices = req.user?.offices;
      const showAllSends = showAll === 'true';
      
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const filters: any = {};
      if (leadId) filters.leadId = Number(leadId);
      if (templateId) filters.templateId = Number(templateId);
      if (status) filters.status = status as string;
      if (sentById) filters.sentById = Number(sentById);
      
      const emailSends = await emailSendServices.findAll(
        filters, 
        userId, 
        userOffices, 
        showAllSends
      );
      return res.json(emailSends);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { showAll } = req.query;
      const userId = req.user?.id;
      const userOffices = req.user?.offices;
      const showAllStats = showAll === 'true';
      
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const stats = await emailSendServices.getStats(userId, userOffices, showAllStats);
      return res.json(stats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async getAvailableVariables(req: Request, res: Response) {
    try {
      const variables = await emailSendServices.getAvailableVariables();
      return res.json(variables);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }
} 