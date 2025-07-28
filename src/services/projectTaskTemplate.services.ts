import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";

const prisma = new PrismaClient();

interface TaskTemplate {
  title: string;
  department: string;
  departments?: string[]; // Para tarefas com múltiplos departamentos
  order: number;
}

export class ProjectTaskTemplateServices {
  
  // Template com as 82 tarefas de implantação
  private readonly IMPLANTACAO_TASKS: TaskTemplate[] = [
    { title: "Confirmação de documentação e pagamento", department: "IMPLANTACAO", order: 1 },
    { title: "Envio de mensagem de boas vindas", department: "IMPLANTACAO", order: 2 },
    { title: "Criação de email corporativo e acesso do portal", department: "TI", order: 3 },
    { title: "Envio de acessos ao e-mail pessoal", department: "IMPLANTACAO", order: 4 },
    { title: "Envio de e-mail de Boas vindas oficiais e Manuais da Franquia c/ para o e-mail corporativo e pessoal", department: "IMPLANTACAO", order: 5 },
    { title: "Contato de Acolhimento Inicial (Raio-x de perfil e intenção de área)", department: "IMPLANTACAO", order: 6 },
    { title: "Preenchimento e envio da ficha para implantação (Marketing, Arquitetura, Processos e Operações)", department: "IMPLANTACAO", order: 7 },
    { title: "Estudo de Mercado Macro", department: "IMPLANTACAO", order: 8 },
    { title: "Conversa com Franqueado sobre áreas levantadas no estudo (Base de procura)", department: "IMPLANTACAO", order: 9 },
    { title: "Início de captação de ponto comercial", department: "IMPLANTACAO", order: 10 },
    { title: "Parceria com imobiliárias e corretores locais (abastecer planilha de parceiros com Cidade, Nome, Telefone)", department: "IMPLANTACAO", order: 11 },
    { title: "Envio do resumo de necessidades para o Ponto Comercial (se não há escrito, arquitetura fazer para a Coordenação de Processos enviar)", department: "IMPLANTACAO", departments: ["IMPLANTACAO", "ARQUITETURA"], order: 12 },
    { title: "Peça 01 no Instagram (Em breve, mais uma ...\")", department: "MARKETING", order: 13 },
    { title: "Levantamento de 01 a 03 pontos comerciais em fase final", department: "IMPLANTACAO", departments: ["IMPLANTACAO", "ARQUITETURA"], order: 14 },
    { title: "Aprovação Comercial e Estrutural", department: "COO", order: 15 },
    { title: "Conferência de Licenças", department: "ARQUITETURA", order: 16 },
    { title: "Finalização processos de aluguel/ negociação", department: "COO", departments: ["COO", "IMPLANTACAO"], order: 17 },
    { title: "Medição do Imóvel ou Planta", department: "ARQUITETURA", order: 18 },
    { title: "Acompanhamento de assinatura do contrato de Arrendamento de imóvel", department: "IMPLANTACAO", order: 19 },
    { title: "Contato da Arquitetura para integração do início das obras", department: "ARQUITETURA", order: 20 },
    { title: "Solicitação de fotos e Vídeos do imóvel", department: "ARQUITETURA", order: 21 },
    { title: "Armazenar os vídeos do imóvel BRUTO no histórico", department: "ARQUITETURA", order: 22 },
    { title: "Envio de passo a passo Contábil", department: "IMPLANTACAO", order: 23 },
    { title: "Criação layout em 3D", department: "ARQUITETURA", order: 24 },
    { title: "Entrega de projeto executivo", department: "ARQUITETURA", order: 25 },
    { title: "Inicio das adequações do imóvel", department: "ARQUITETURA", order: 26 },
    { title: "Mobiliário - Cotação atualizada", department: "IMPLANTACAO", order: 27 },
    { title: "Equipamentos - Cotação e orçamentos atualizados", department: "IMPLANTACAO", order: 28 },
    { title: "Comunicação Visual - Fachada, Adesivos e afins - Contratação de Empresa", department: "MARKETING", order: 29 },
    { title: "Confecção de Embalagens", department: "MARKETING", order: 30 },
    { title: "Papelaria Física -  Cardápios, Quadros, Displays, etc", department: "MARKETING", order: 31 },
    { title: "Acompanhamento da obra", department: "ARQUITETURA", order: 32 },
    { title: "Contato com a equipe de construção", department: "ARQUITETURA", order: 33 },
    { title: "Abertura ou Enquadramento de Empresa", department: "IMPLANTACAO", order: 34 },
    { title: "Solicitação de Telefonia e aparatos administrativos", department: "IMPLANTACAO", order: 35 },
    { title: "Criar Unidade no Aplicativo Delivery e Cupons", department: "IMPLANTACAO", order: 36 },
    { title: "Acompanhamento da Abertura de conta corrente pessoa jurídica", department: "IMPLANTACAO", order: 37 },
    { title: "Registo com fornecedores", department: "IMPLANTACAO", order: 38 },
    { title: "Checklist parcial 001", department: "CLO", departments: ["CLO", "CAO"], order: 39 },
    { title: "Contato Uber Etas", department: "TI", order: 40 },
    { title: "Contato zonesoft", department: "TI", order: 41 },
    { title: "Criação de Delivery Local", department: "TI", order: 42 },
    { title: "Estimativa de pedidos iniciais", department: "IMPLANTACAO", order: 43 },
    { title: "Alinhamento Marketing Regional", department: "MARKETING", order: 44 },
    { title: "Mapeamento de Produtoras de Vídeos e Filmmakers (receber portfolio e orçamento)", department: "MARKETING", order: 45 },
    { title: "Mapeamento de Influenciadores", department: "MARKETING", order: 46 },
    { title: "Mapeamento de Microinfluenciadores", department: "MARKETING", order: 47 },
    { title: "Mapeamento de Páginas gastronômicas", department: "MARKETING", order: 48 },
    { title: "Peças de Teaser já com Tangibilidade", department: "MARKETING", order: 49 },
    { title: "Peças conceituais", department: "MARKETING", order: 50 },
    { title: "Vídeo com o Franchisado (Temperatura e Chamado)", department: "MARKETING", order: 51 },
    { title: "Mensagens automaticas Instagram", department: "MARKETING", order: 52 },
    { title: "Criação de Google Meu Negócio", department: "MARKETING", order: 53 },
    { title: "Checklist parcial 002", department: "CLO", departments: ["CLO", "CAO"], order: 54 },
    { title: "Peça publicitária para RH da unidade", department: "MARKETING", order: 55 },
    { title: "Anúncio para contratações de Gerente de loja, atendentes e colaboradores em geral", department: "IMPLANTACAO", order: 56 },
    { title: "Solicitação de compra de uniformes", department: "IMPLANTACAO", order: 57 },
    { title: "Providência do seguro das instalações da Franquia e equipamentos (incêndio, roubo, lucros cessantes, responsabilidade civil) e sistemas de alarmes", department: "IMPLANTACAO", order: 58 },
    { title: "Recrutamento e seleção de equipe", department: "IMPLANTACAO", order: 59 },
    { title: "Definição de estoque inaugural", department: "IMPLANTACAO", order: 60 },
    { title: "Providência de compras e produtos", department: "IMPLANTACAO", order: 61 },
    { title: "Checklist parcial 003", department: "CLO", departments: ["CLO", "CAO"], order: 62 },
    { title: "Agendamento de treinamento", department: "IMPLANTACAO", order: 63 },
    { title: "Orçamento de hospedagem", department: "IMPLANTACAO", order: 64 },
    { title: "Orçamento de Passagem", department: "IMPLANTACAO", order: 65 },
    { title: "Orçamento de Locomoção", department: "IMPLANTACAO", order: 66 },
    { title: "Orçamento de Alimentação", department: "IMPLANTACAO", order: 67 },
    { title: "Recebimento de valor previsto", department: "IMPLANTACAO", order: 68 },
    { title: "Contratação de Produtora de Vídeo e/ou Filmmaker", department: "MARKETING", order: 69 },
    { title: "Convites para Pré-inauguração", department: "MARKETING", order: 70 },
    { title: "Solicitar vídeo teaser a influenciadores", department: "MARKETING", order: 71 },
    { title: "Definir Quantidade de \"Campanha de Insumos\"", department: "IMPLANTACAO", order: 72 },
    { title: "Oppening Ads (200 primeiros Smoke a 1€)", department: "MARKETING", order: 73 },
    { title: "Checklist Final (todos os departamentos)", department: "COO", departments: ["COO", "CLO", "CAO", "MARKETING", "ARQUITETURA", "IMPLANTACAO"], order: 74 },
    { title: "Intensivo de treinamento", department: "IMPLANTACAO", order: 75 },
    { title: "Pré-inauguração (pico de funcionamento)", department: "IMPLANTACAO", order: 76 },
    { title: "Feedback de erros e acertos", department: "IMPLANTACAO", order: 77 },
    { title: "Inauguração", department: "IMPLANTACAO", order: 78 },
    { title: "Radar de Publicações", department: "IMPLANTACAO", departments: ["IMPLANTACAO", "MARKETING"], order: 79 },
    { title: "Solicitação de imagens a parceiros", department: "IMPLANTACAO", departments: ["IMPLANTACAO", "MARKETING"], order: 80 },
    { title: "Envio de agradecimentos", department: "IMPLANTACAO", departments: ["IMPLANTACAO", "MARKETING"], order: 81 },
    { title: "Feedback com o Franqueado", department: "IMPLANTACAO", departments: ["IMPLANTACAO", "MARKETING"], order: 82 }
  ];

  /**
   * Cria todas as tarefas do template para um projeto específico
   */
  async createTasksFromTemplate(projectId: number): Promise<void> {
    try {
    
      // Verificar se o projeto existe
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new AppError(404, "Projeto não encontrado");
      }

      // Buscar usuários por departamento para atribuições automáticas
      const usersByDepartment = await this.getUsersByDepartment();

      // Criar todas as tarefas do template
      const createdTasks = [];
      
      for (const taskTemplate of this.IMPLANTACAO_TASKS) {
        try {
          // Criar a tarefa
          const task = await prisma.projectTask.create({
            data: {
              title: taskTemplate.title,
              description: `Tarefa automática de implantação - ${taskTemplate.title}`,
              status: 'A_FAZER',
              priority: 'MEDIA',
              department: taskTemplate.department,
              projectId: projectId,
              order: taskTemplate.order
            }
          });

          createdTasks.push(task);

          // Atribuir automaticamente aos usuários do(s) departamento(s)
          const departmentsToAssign = taskTemplate.departments || [taskTemplate.department];
          const allDepartmentUsers: number[] = [];
          
          departmentsToAssign.forEach(dept => {
            const deptUsers = usersByDepartment[dept] || [];
            allDepartmentUsers.push(...deptUsers);
          });
          
          // Remover duplicatas
          const uniqueUsers = [...new Set(allDepartmentUsers)];
          
          if (uniqueUsers.length > 0) {
            await this.assignTaskToUsers(task.id, uniqueUsers);
          }

        } catch (error) {
          console.error(`Erro ao criar tarefa "${taskTemplate.title}":`, error);
          // Continuar criando as outras tarefas mesmo se uma falhar
        }
      }

    } catch (error) {
      console.error('Erro ao criar tarefas do template:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Erro ao criar tarefas do template");
    }
  }

  /**
   * Busca usuários agrupados por departamento
   */
  async getUsersByDepartment(): Promise<Record<string, number[]>> {
    try {
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          department: true
        }
      });

      const usersByDepartment: Record<string, number[]> = {};

      users.forEach(user => {
        if (user.department) {
          if (!usersByDepartment[user.department]) {
            usersByDepartment[user.department] = [];
          }
          usersByDepartment[user.department].push(user.id);
        }
      });
      return usersByDepartment;
    } catch (error) {
      console.error('Erro ao buscar usuários por departamento:', error);
      return {};
    }
  }

  /**
   * Busca usuários completos de um departamento específico
   */
  async getUsersFromDepartment(department: string) {
    try {
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          department: department
        },
        select: {
          id: true,
          name: true,
          email: true,
          img: true,
          department: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários do departamento:', error);
      throw new AppError(500, "Erro ao buscar usuários do departamento");
    }
  }

  /**
   * Atribui uma tarefa a múltiplos usuários
   */
  private async assignTaskToUsers(taskId: number, userIds: number[]): Promise<void> {
    try {
      // Criar atribuições múltiplas para a tarefa
      const assignments = userIds.map(userId => ({
        projectTaskId: taskId,
        userId: userId,
        assignedAt: new Date()
      }));

      await prisma.projectTaskAssignment.createMany({
        data: assignments,
        skipDuplicates: true
      });

    } catch (error) {
      console.error(`Erro ao atribuir tarefa ${taskId} aos usuários:`, error);
      // Não lançar erro para não interromper o processo de criação
    }
  }

  /**
   * Busca tarefas por departamento
   */
  async getTasksByDepartment(department: string, projectId?: number): Promise<any[]> {
    try {
      const whereClause: any = {
        department: department
      };

      if (projectId) {
        whereClause.projectId = projectId;
      }

      const tasks = await prisma.projectTask.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              client: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao buscar tarefas por departamento:', error);
      throw new AppError(500, "Erro ao buscar tarefas por departamento");
    }
  }

  /**
   * Obtém estatísticas de tarefas por departamento
   */
  async getDepartmentStats(department: string): Promise<any> {
    try {
      const stats = await prisma.projectTask.groupBy({
        by: ['status'],
        where: {
          department: department
        },
        _count: {
          id: true
        }
      });

      const total = await prisma.projectTask.count({
        where: {
          department: department
        }
      });

      const assigned = await prisma.projectTask.count({
        where: {
          department: department,
          assignedToId: {
            not: null
          }
        }
      });

      const unassigned = total - assigned;

      return {
        total,
        assigned,
        unassigned,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do departamento:', error);
      throw new AppError(500, "Erro ao obter estatísticas do departamento");
    }
  }

  /**
   * Obtém todos os departamentos disponíveis nos templates
   */
  getAllDepartments(): string[] {
    const departments = this.IMPLANTACAO_TASKS.map(template => template.department);
    return [...new Set(departments)].sort();
  }
} 