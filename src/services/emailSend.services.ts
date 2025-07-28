import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { EmailConfigServices } from "./emailConfig.services";

const prisma = new PrismaClient();
const emailConfigServices = new EmailConfigServices();

export class EmailSendServices {
  async sendEmail(data: {
    templateId: number;
    leadId: number;
    sentById: number;
    configId?: number;
  }) {
    try {
      console.log('=== SERVICE SEND EMAIL ===');
      console.log('Dados recebidos:', data);
      
      // Buscar template
      console.log('Buscando template com ID:', data.templateId);
      const template = await prisma.emailTemplate.findUnique({
        where: { id: data.templateId }
      });

      console.log('Template encontrado:', template ? 'SIM' : 'NÃO');
      if (!template) {
        throw new Error("Template não encontrado");
      }

      // Buscar lead
      console.log('Buscando lead com ID:', data.leadId);
      const lead = await prisma.lead.findUnique({
        where: { id: data.leadId },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      console.log('Lead encontrado:', lead ? 'SIM' : 'NÃO');
      if (!lead) {
        throw new Error("Lead não encontrado");
      }

      // Buscar configuração SMTP
      console.log('Buscando configuração SMTP. ConfigId:', data.configId);
      let config;
      if (data.configId) {
        config = await emailConfigServices.findById(data.configId);
        console.log('Config por ID encontrada:', config ? 'SIM' : 'NÃO');
      } else {
        config = await emailConfigServices.findDefault();
        console.log('Config padrão encontrada:', config ? 'SIM' : 'NÃO');
      }

      if (!config) {
        console.error('Nenhuma configuração SMTP encontrada');
        throw new Error("Configuração SMTP não encontrada");
      }
      console.log('Configuração SMTP:', { id: config.id, name: config.name, host: config.host });

      // Processar variáveis no template
      const processedSubject = this.processVariables(template.subject, lead);
      const processedContent = this.processVariables(template.content, lead);

      // Criar registro de envio
      const emailSend = await prisma.emailSend.create({
        data: {
          templateId: data.templateId,
          configId: config.id,
          leadId: data.leadId,
          sentById: data.sentById,
          toEmail: lead.email,
          toName: lead.name,
          subject: processedSubject,
          content: processedContent,
          status: "PENDING"
        }
      });

      // Configurar transporter
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password
        }
      });

      // Enviar e-mail
      const mailOptions = {
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: `"${lead.name}" <${lead.email}>`,
        subject: processedSubject,
        html: processedContent
      };

      const result = await transporter.sendMail(mailOptions);

      // Atualizar status para enviado
      await prisma.emailSend.update({
        where: { id: emailSend.id },
        data: {
          status: "SENT",
          sentAt: new Date()
        }
      });

      return {
        success: true,
        emailSendId: emailSend.id,
        messageId: result.messageId
      };

    } catch (error) {
      // Se houve erro e já criou o registro, atualizar com erro
      if (data.templateId && data.leadId) {
        const existingRecord = await prisma.emailSend.findFirst({
          where: {
            templateId: data.templateId,
            leadId: data.leadId,
            sentById: data.sentById,
            status: "PENDING"
          },
          orderBy: { createdAt: 'desc' }
        });

        if (existingRecord) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          await prisma.emailSend.update({
            where: { id: existingRecord.id },
            data: {
              status: "FAILED",
              errorMessage: errorMessage
            }
          });
        }
      }

      throw error;
    }
  }

  async sendBulkEmail(data: {
    templateId: number;
    leadIds: number[];
    sentById: number;
    configId?: number;
  }) {
    const results = [];

    for (const leadId of data.leadIds) {
      try {
        const result = await this.sendEmail({
          templateId: data.templateId,
          leadId,
          sentById: data.sentById,
          configId: data.configId
        });
        results.push({ leadId, success: true, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.push({ leadId, success: false, error: errorMessage });
      }
    }

    return results;
  }

  async findAll(
    filters?: {
      leadId?: number;
      templateId?: number;
      status?: string;
      sentById?: number;
    },
    userId?: number,
    userOffices?: string,
    showAllSends?: boolean
  ) {
    const where: any = {};

    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.templateId) where.templateId = filters.templateId;
    if (filters?.status) where.status = filters.status;
    if (filters?.sentById) where.sentById = filters.sentById;

    // Aplicar filtro de permissão:
    // Se não for diretor OU não estiver vendo todos, mostrar apenas envios do próprio usuário
    const isDirector = userOffices === 'Diretor';
    if (!isDirector || !showAllSends) {
      where.sentById = userId;
    }

    return prisma.emailSend.findMany({
      where,
      include: {
        template: {
          select: {
            name: true,
            category: true
          }
        },
        lead: {
          select: {
            name: true,
            email: true,
            company: true
          }
        },
        sentBy: {
          select: {
            name: true,
            email: true,
            offices: true
          }
        },
        config: {
          select: {
            name: true,
            fromEmail: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getStats(userId?: number, userOffices?: string, showAllStats?: boolean) {
    // Aplicar filtro de permissão baseado no usuário
    const where: any = {};
    const isDirector = userOffices === 'Diretor';
    if (!isDirector || !showAllStats) {
      where.sentById = userId;
    }

    // Estatísticas básicas
    const total = await prisma.emailSend.count({ where });
    const sent = await prisma.emailSend.count({ where: { ...where, status: "SENT" } });
    const failed = await prisma.emailSend.count({ where: { ...where, status: "FAILED" } });
    const pending = await prisma.emailSend.count({ where: { ...where, status: "PENDING" } });

    // Estatísticas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sentToday = await prisma.emailSend.count({ 
      where: { 
        ...where, 
        status: "SENT", 
        sentAt: { gte: today } 
      } 
    });

    // Estatísticas dos últimos 7 dias
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const sentLastWeek = await prisma.emailSend.count({ 
      where: { 
        ...where, 
        status: "SENT", 
        sentAt: { gte: lastWeek } 
      } 
    });

    // Taxa de sucesso
    const successRate = total > 0 ? ((sent / total) * 100) : 0;
    const deliveryRate = total > 0 ? ((sent / total) * 100) : 0;

    // Estatísticas por template (top 5)
    const templateStats = await prisma.emailSend.groupBy({
      by: ['templateId'],
      where: { ...where, status: "SENT" },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // Buscar nomes dos templates
    const templatesWithNames = await Promise.all(
      templateStats.map(async (stat) => {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: stat.templateId },
          select: { name: true, category: true }
        });
        return {
          templateId: stat.templateId,
          templateName: template?.name || 'Template não encontrado',
          category: template?.category || 'GERAL',
          count: stat._count.id
        };
      })
    );

    // Contagem de templates ativos
    const activeTemplatesWhere = isDirector && showAllStats ? {} : { createdById: userId };
    const activeTemplates = await prisma.emailTemplate.count({ 
      where: { ...activeTemplatesWhere, isActive: true } 
    });

    return {
      total,
      sent,
      failed,
      pending,
      sentToday,
      sentLastWeek,
      successRate: Number(successRate.toFixed(1)),
      deliveryRate: Number(deliveryRate.toFixed(1)),
      activeTemplates,
      templateStats: templatesWithNames,
      // Dados para gráficos (últimos 7 dias)
      dailyStats: await this.getDailyStats(where)
    };
  }

  private async getDailyStats(where: any) {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayStats = await prisma.emailSend.count({
        where: {
          ...where,
          status: "SENT",
          sentAt: {
            gte: date,
            lt: nextDate
          }
        }
      });
      
      stats.push({
        date: date.toLocaleDateString('pt-BR'),
        sent: dayStats
      });
    }
    return stats;
  }

  private processVariables(content: string, lead: any): string {
    const variables = {
      '{{nome}}': lead.name || '',
      '{{email}}': lead.email || '',
      '{{telefone}}': lead.phone || '',
      '{{empresa}}': lead.company || '',
      '{{cidade}}': lead.city || '',
      '{{estado}}': lead.state || '',
      '{{pais}}': lead.country || '',
      '{{data_cadastro}}': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '',
      '{{consultor}}': lead.user?.name || '',
      '{{email_consultor}}': lead.user?.email || '',
      '{{valor}}': lead.value ? `R$ ${lead.value.toFixed(2)}` : '',
      '{{origem}}': lead.source || '',
      '{{status}}': lead.status || '',
      '{{observacoes}}': lead.notes || ''
    };

    let processedContent = content;
    
    Object.entries(variables).forEach(([variable, value]) => {
      const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  }

  async getAvailableVariables() {
    return [
      { name: '{{nome}}', label: 'Nome do Lead', category: 'LEAD' },
      { name: '{{email}}', label: 'E-mail do Lead', category: 'LEAD' },
      { name: '{{telefone}}', label: 'Telefone do Lead', category: 'LEAD' },
      { name: '{{empresa}}', label: 'Empresa do Lead', category: 'LEAD' },
      { name: '{{cidade}}', label: 'Cidade do Lead', category: 'LEAD' },
      { name: '{{estado}}', label: 'Estado do Lead', category: 'LEAD' },
      { name: '{{pais}}', label: 'País do Lead', category: 'LEAD' },
      { name: '{{data_cadastro}}', label: 'Data de Cadastro', category: 'LEAD' },
      { name: '{{consultor}}', label: 'Nome do Consultor', category: 'USER' },
      { name: '{{email_consultor}}', label: 'E-mail do Consultor', category: 'USER' },
      { name: '{{valor}}', label: 'Valor do Lead', category: 'LEAD' },
      { name: '{{origem}}', label: 'Origem do Lead', category: 'LEAD' },
      { name: '{{status}}', label: 'Status do Lead', category: 'LEAD' },
      { name: '{{observacoes}}', label: 'Observações do Lead', category: 'LEAD' }
    ];
  }
} 