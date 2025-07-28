import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";
import { NotificationServices } from "./notification.services";
import { prisma } from "../database/prisma";

const prismaClient = new PrismaClient();

export class LeadServices {
  async create(data: any, userId: number) {
    try {
      const lead = await prismaClient.lead.create({
        data: {
          ...data,
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          }
        }
      });

      // Disparar notificação ao criar lead
      const notificationServices = new NotificationServices();
      await notificationServices.create({
        title: "Novo Lead cadastrado",
        message: `Lead ${lead.name} foi cadastrado com sucesso!`,
        userId: userId,
      });

      return lead;
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      throw new AppError(500, "Erro ao criar lead");
    }
  }

  async findMany(userId: number, userPermissions: string[] = [], showAllLeads: boolean = false, page = 0, limit = 10, filters: any = {}, userDepartment?: string) {
    // Verificar se o usuário tem permissão para ver todos os leads
    // Também considera usuários da Diretoria como tendo permissão total
    const canSeeAllLeads = userPermissions.includes('leads_view_all') || 
                          userPermissions.includes('admin_access') ||
                          userDepartment === 'Diretoria';
    let where: any = {};

    try {
      // PRIORIDADE MÁXIMA: Se há filtro assignedBy, aplicar SEMPRE
      if (filters.assignedBy) {
        where.userId = parseInt(filters.assignedBy);
        console.log('🎯 Backend - Aplicando filtro assignedBy:', filters.assignedBy, '-> userId:', parseInt(filters.assignedBy));
      }
      // SEGUNDA PRIORIDADE: Filtro por departamento - para Master Office (MF)
      else if (filters.department) {
        // Buscar leads que:
        // 1. Estão atribuídos a usuários do departamento especificado OU
        // 2. Têm tarefas atribuídas a usuários do departamento especificado
        where.OR = [
          // Leads atribuídos diretamente a usuários do departamento
          {
            user: {
              department: filters.department
            }
          },
          // Leads que têm tarefas atribuídas a usuários do departamento
          {
            tasks: {
              some: {
                assignedTo: {
                  department: filters.department
                }
              }
            }
          }
        ];
      }
      // TERCEIRA PRIORIDADE: Filtro específico por userId 
      else if (filters.userId && canSeeAllLeads && showAllLeads) {
        where.userId = parseInt(filters.userId);
      }
      // PADRÃO: Mostrar apenas leads do próprio usuário se não for diretor ou não estiver vendo todos
      else if (!canSeeAllLeads || !showAllLeads) {
        where.userId = userId;
      }

      // Adiciona filtros recebidos
      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters.email) {
        where.email = { contains: filters.email, mode: 'insensitive' };
      }
      if (filters.phone) {
        where.phone = { contains: filters.phone };
      }
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.company) {
        where.company = { contains: filters.company, mode: 'insensitive' };
      }
      if (filters.source) {
        where.source = { contains: filters.source, mode: 'insensitive' };
      }

      // Debug: Log da query construída
      console.log('🔍 Backend - Resultado final:', {
        'Filtros recebidos': filters,
        'assignedBy detectado': !!filters.assignedBy,
        'canSeeAllLeads': canSeeAllLeads,
        'showAllLeads': showAllLeads,
        'Where clause final': where
      });

      const [total, leads] = await Promise.all([
        // Conta total de registros com filtros
        prismaClient.lead.count({ where }),
        // Busca leads paginados com filtros
        prismaClient.lead.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                img: true,
                email: true,
                offices: true,
                department: true
              }
            },
            // Incluir tarefas MF quando filtro por departamento estiver ativo
            tasks: filters.department ? {
              where: {
                assignedTo: {
                  department: filters.department
                }
              },
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    department: true
                  }
                }
              }
            } : false
          },
          orderBy: {
            updatedAt: 'desc'
          },
          skip: page * limit,
          take: limit
        })
      ]);

      return {
        total,
        leads,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      throw new AppError(500, "Erro ao buscar leads");
    }
  }

  async findOne(id: number, userId: number, userPermissions: string[] = []) {
    try {
      // Verificar se o usuário tem permissão para ver todos os leads
      const canSeeAllLeads = userPermissions.includes('leads_view_all') || userPermissions.includes('admin_access');

      let where: any = { id };

      // Se não for diretor, aplicar filtros de permissão
      if (!canSeeAllLeads) {
        where.OR = [
          // Lead atribuído diretamente ao usuário
          { userId },
          // Lead que tem tarefas atribuídas ao usuário
          {
            tasks: {
              some: {
                assignedToId: userId
              }
            }
          },
          // Usuários com permissão de departamento podem ver leads relacionados
          ...(userPermissions.includes('leads_department_access') ? [{
            tasks: {
              some: {
                assignedTo: {
                  department: { not: null }
                }
              }
            }
          }] : [])
        ];
      }

      const lead = await prismaClient.lead.findFirst({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  department: true
                }
              }
            }
          }
        }
      });

      if (!lead) {
        throw new AppError(404, "Lead não encontrado");
      }

      return lead;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar lead:', error);
      throw new AppError(500, "Erro ao buscar lead");
    }
  }

  async update(id: number, data: any, userId?: number) {
    try {
      
      const existingLead = await prismaClient.lead.findUnique({
        where: { id }
      });

      if (!existingLead) {
        throw new AppError(404, "Lead não encontrado");
      }

      // Se o status está sendo alterado para CONVERTIDOS, criar tarefa para Diretoria
      if (data.status === 'CONVERTIDOS' && existingLead.status !== 'CONVERTIDOS') {
        await this.createApprovalTask(existingLead, userId);
      } 

      const updatedLead = await prismaClient.lead.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          }
        }
      });

      
      return updatedLead;
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao atualizar lead");
    }
  }

  // Método para criar tarefa de aprovação para a Diretoria
  private async createApprovalTask(lead: any, requestedBy?: number) {
    try {
      
      // Buscar usuários do departamento Diretoria
      const directors = await prismaClient.user.findMany({
        where: {
          department: 'Diretoria',
          status: 'ACTIVE'
        }
      });


      if (directors.length === 0) {
        console.warn('Nenhum usuário do departamento Diretoria encontrado para aprovação do lead');
        return;
      }

      // Buscar informações do usuário que solicitou a conversão
      let requesterInfo = 'Sistema';
      if (requestedBy) {
        try {
          const requester = await prismaClient.user.findUnique({
            where: { id: requestedBy },
            select: {
              name: true,
              email: true
            }
          });
          
          if (requester) {
            requesterInfo = `${requester.name} (${requester.email})`;
          } else {
            requesterInfo = `Usuário ID ${requestedBy}`;
          }
        } catch (error) {
          console.error('Erro ao buscar informações do usuário solicitante:', error);
          requesterInfo = `Usuário ID ${requestedBy}`;
        }
      }

      // Criar tarefa para o primeiro usuário da Diretoria encontrado
      const director = directors[0];
      
      
      const taskData = {
        title: `Aprovação para Conversão - ${lead.name}`,
        description: `Lead "${lead.name}" (${lead.email}) foi movido para CONVERTIDOS e precisa de aprovação para ser convertido em cliente.\n\nDetalhes do Lead:\n- Empresa: ${lead.company || 'Não informado'}\n- Telefone: ${lead.phone}\n- Valor: ${lead.value ? `R$ ${lead.value.toLocaleString('pt-BR')}` : 'Não informado'}\n- Origem: ${lead.source || 'Não informado'}\n\nSolicitado por: ${requesterInfo}`,
        status: 'TODO',
        priority: 'HIGH',
        assignedToId: director.id,
        leadId: lead.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias a partir de agora
      };


      const createdTask = await prismaClient.task.create({
        data: taskData
      });
    } catch (error) {
      console.error('Erro ao criar tarefa de aprovação:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  }

  // Método para aprovar conversão de lead
  async approveConversion(leadId: number, approvedBy: number) {
    try {
      const lead = await prismaClient.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        throw new AppError(404, "Lead não encontrado");
      }

      if (lead.status !== 'CONVERTIDOS') {
        throw new AppError(400, "Lead deve estar no status CONVERTIDOS para ser aprovado");
      }

      if (lead.approvedForConversion) {
        throw new AppError(400, "Lead já foi aprovado para conversão");
      }

      // Verificar se o usuário é da Diretoria
      const approver = await prismaClient.user.findUnique({
        where: { id: approvedBy }
      });

      if (!approver || approver.department !== 'Diretoria') {
        throw new AppError(403, "Apenas usuários do departamento Diretoria podem aprovar conversões");
      }

      // Aprovar o lead
      const approvedLead = await prismaClient.lead.update({
        where: { id: leadId },
        data: {
          approvedForConversion: true,
          approvedBy: approvedBy,
          approvedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          }
        }
      });

      // Marcar tarefas relacionadas como concluídas
      await prismaClient.task.updateMany({
        where: {
          leadId: leadId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          title: {
            contains: 'Aprovação para Conversão'
          }
        },
        data: {
          status: 'DONE'
        }
      });

      return approvedLead;
    } catch (error) {
      console.error('Erro ao aprovar conversão:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao aprovar conversão");
    }
  }

  // Método para rejeitar conversão de lead
  async rejectConversion(leadId: number, rejectedBy: number, reason?: string) {
    try {
      const lead = await prismaClient.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        throw new AppError(404, "Lead não encontrado");
      }

      if (lead.status !== 'CONVERTIDOS') {
        throw new AppError(400, "Lead deve estar no status CONVERTIDOS para ser rejeitado");
      }

      // Verificar se o usuário é da Diretoria
      const rejector = await prismaClient.user.findUnique({
        where: { id: rejectedBy }
      });

      if (!rejector || rejector.department !== 'Diretoria') {
        throw new AppError(403, "Apenas usuários do departamento Diretoria podem rejeitar conversões");
      }

      // Voltar o lead para REGISTRO_CONTRATO
      const rejectedLead = await prismaClient.lead.update({
        where: { id: leadId },
        data: {
          status: 'REGISTRO_CONTRATO',
          approvedForConversion: false,
          approvedBy: null,
          approvedAt: null,
          notes: lead.notes ? 
            `${lead.notes}\n\n[CONVERSÃO REJEITADA em ${new Date().toLocaleString('pt-BR')}]\nMotivo: ${reason || 'Não informado'}\nRejeitado por: ${rejector.name}` :
            `[CONVERSÃO REJEITADA em ${new Date().toLocaleString('pt-BR')}]\nMotivo: ${reason || 'Não informado'}\nRejeitado por: ${rejector.name}`
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          }
        }
      });

      // Marcar tarefas relacionadas como concluídas
      await prismaClient.task.updateMany({
        where: {
          leadId: leadId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          title: {
            contains: 'Aprovação para Conversão'
          }
        },
        data: {
          status: 'DONE'
        }
      });

      return rejectedLead;
    } catch (error) {
      console.error('Erro ao rejeitar conversão:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao rejeitar conversão");
    }
  }

  // Método para buscar leads aprovados para conversão
  async getApprovedForConversion() {
    try {
      const approvedLeads = await prismaClient.lead.findMany({
        where: {
          status: 'CONVERTIDOS',
          approvedForConversion: true,
          convertedToClient: false
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          }
        },
        orderBy: {
          approvedAt: 'desc'
        }
      });

      return approvedLeads;
    } catch (error) {
      console.error('Erro ao buscar leads aprovados:', error);
      throw new AppError(500, "Erro ao buscar leads aprovados");
    }
  }

  // Método para marcar lead como convertido em cliente
  async markAsConverted(leadId: number) {
    try {
      const lead = await prismaClient.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        throw new AppError(404, "Lead não encontrado");
      }

      if (!lead.approvedForConversion) {
        throw new AppError(400, "Lead deve estar aprovado para conversão");
      }

      if (lead.convertedToClient) {
        throw new AppError(400, "Lead já foi convertido em cliente");
      }

      const convertedLead = await prismaClient.lead.update({
        where: { id: leadId },
        data: {
          convertedToClient: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              img: true,
              email: true,
              offices: true,
              department: true
            }
          }
        }
      });

      return convertedLead;
    } catch (error) {
      console.error('Erro ao marcar lead como convertido:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao marcar lead como convertido");
    }
  }

  async delete(id: number, userId: number) {
    try {
      // Primeiro, verificar se o usuário tem permissão
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: { 
          offices: true, 
          department: true 
        }
      });

      const allowedOffices = ['Diretor'];
      const userOfficesArray = Array.isArray(user?.offices) ? user.offices : [user?.offices];
      const canDeleteAllLeads = userOfficesArray.some(office => allowedOffices.includes(office));

      let where: any = { id };

      // Se não for diretor, só pode deletar seus próprios leads
      if (!canDeleteAllLeads) {
        where.userId = userId;
      }

      const lead = await prismaClient.lead.findFirst({
        where,
      });

      if (!lead) {
        throw new AppError(404, "Lead não encontrado ou você não tem permissão para deletá-lo");
      }

      // Deletar tarefas relacionadas primeiro (se houver)
      await prismaClient.task.deleteMany({
        where: {
          leadId: id
        }
      });

      // Depois deletar o lead
      await prismaClient.lead.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao deletar lead:', error);
      throw new AppError(500, "Erro ao deletar lead");
    }
  }
}

export const leadServices = new LeadServices(); 