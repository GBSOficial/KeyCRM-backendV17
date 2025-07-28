import { prisma } from '../database/prismaClient';
import { AppError } from '../errors/appError';

export class PermissionService {
  // ===== PERMISSÕES =====
  
  async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async createPermission(data: {
    key: string;
    name: string;
    description?: string;
    module: string;
  }) {
    const existingPermission = await prisma.permission.findUnique({
      where: { key: data.key }
    });

    if (existingPermission) {
      throw new AppError(400, 'Permissão com esta chave já existe');
    }

    return await prisma.permission.create({
      data
    });
  }

  async updatePermission(id: number, data: {
    name?: string;
    description?: string;
    module?: string;
  }) {
    return await prisma.permission.update({
      where: { id },
      data
    });
  }

  async deletePermission(id: number) {
    // Verificar se a permissão está sendo usada
    const rolePermissions = await prisma.rolePermission.count({
      where: { permissionId: id }
    });

    const userPermissions = await prisma.userPermission.count({
      where: { permissionId: id }
    });

    if (rolePermissions > 0 || userPermissions > 0) {
      throw new AppError(400, 'Não é possível excluir uma permissão que está sendo utilizada');
    }

    return await prisma.permission.delete({
      where: { id }
    });
  }

  // ===== ROLES/FUNÇÕES =====
  
  async getAllRoles() {
    return await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createRole(data: {
    name: string;
    description?: string;
    color?: string;
    permissionIds?: number[];
  }) {
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name }
    });

    if (existingRole) {
      throw new AppError(400, 'Função com este nome já existe');
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#2196F3'
      }
    });

    // Adicionar permissões se fornecidas
    if (data.permissionIds && data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map(permissionId => ({
          roleId: role.id,
          permissionId
        }))
      });
    }

    return role;
  }

  async updateRole(id: number, data: {
    name?: string;
    description?: string;
    color?: string;
    permissionIds?: number[];
  }) {
    // Verificar se é um role do sistema
    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      throw new AppError(404, 'Função não encontrada');
    }

    if (role.isSystem) {
      throw new AppError(400, 'Não é possível editar funções do sistema');
    }

    // Atualizar dados básicos
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color
      }
    });

    // Atualizar permissões se fornecidas
    if (data.permissionIds !== undefined) {
      // Remover permissões existentes
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Adicionar novas permissões
      if (data.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: data.permissionIds.map(permissionId => ({
            roleId: id,
            permissionId
          }))
        });
      }
    }

    return updatedRole;
  }

  async deleteRole(id: number) {
    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      throw new AppError(404, 'Função não encontrada');
    }

    if (role.isSystem) {
      throw new AppError(400, 'Não é possível excluir funções do sistema');
    }

    // Verificar se há usuários com esta função
    const userRoles = await prisma.userRole.count({
      where: { roleId: id }
    });

    if (userRoles > 0) {
      throw new AppError(400, 'Não é possível excluir uma função que está sendo utilizada por usuários');
    }

    return await prisma.role.delete({
      where: { id }
    });
  }

  // ===== ATRIBUIÇÕES DE USUÁRIO =====
  
  async getUserPermissions(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Combinar permissões de roles e permissões diretas
    const rolePermissions = user.userRoles.flatMap(ur => 
      ur.role.rolePermissions.map(rp => rp.permission)
    );
    
    const directPermissions = user.userPermissions
      .filter(up => up.granted)
      .map(up => up.permission);

    const deniedPermissions = user.userPermissions
      .filter(up => !up.granted)
      .map(up => up.permission);

    // Remover duplicatas e aplicar negações
    const allPermissions = [...rolePermissions, ...directPermissions];
    const uniquePermissions = allPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    );

    // Remover permissões negadas
    const finalPermissions = uniquePermissions.filter(permission => 
      !deniedPermissions.some(denied => denied.id === permission.id)
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department
      },
      roles: user.userRoles.map(ur => ur.role),
      permissions: finalPermissions,
      directPermissions: user.userPermissions
    };
  }

  async assignRoleToUser(userId: number, roleId: number, assignedBy: number) {
    // Verificar se já tem esta função
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingAssignment) {
      throw new AppError(400, 'Usuário já possui esta função');
    }

    return await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy
      }
    });
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    return await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });
  }

  async assignPermissionToUser(userId: number, permissionId: number, granted: boolean, assignedBy: number) {
    // Verificar se já tem esta permissão
    const existingPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      }
    });

    if (existingPermission) {
      // Atualizar permissão existente
      return await prisma.userPermission.update({
        where: {
          userId_permissionId: {
            userId,
            permissionId
          }
        },
        data: {
          granted,
          assignedBy
        }
      });
    }

    return await prisma.userPermission.create({
      data: {
        userId,
        permissionId,
        granted,
        assignedBy
      }
    });
  }

  async removePermissionFromUser(userId: number, permissionId: number) {
    return await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      }
    });
  }

  // ===== VERIFICAÇÃO DE PERMISSÕES =====
  
  async checkUserPermission(userId: number, permissionKey: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.permissions.some(permission => permission.key === permissionKey);
  }

  async checkUserPermissions(userId: number, permissionKeys: string[]): Promise<{ [key: string]: boolean }> {
    const userPermissions = await this.getUserPermissions(userId);
    const result: { [key: string]: boolean } = {};
    
    for (const key of permissionKeys) {
      result[key] = userPermissions.permissions.some(permission => permission.key === key);
    }
    
    return result;
  }

  // ===== INICIALIZAÇÃO DO SISTEMA =====
  
  async initializeSystemPermissions() {
    const defaultPermissions = [
      // Admin
      { key: 'admin_access', name: 'Acesso ao Painel Admin', module: 'Admin' },
      { key: 'admin_users_manage', name: 'Gerenciar Usuários', module: 'Admin' },
      { key: 'admin_permissions_manage', name: 'Gerenciar Permissões', module: 'Admin' },
      
      // Leads
      { key: 'leads_view', name: 'Visualizar Leads', module: 'Leads' },
      { key: 'leads_create', name: 'Criar Leads', module: 'Leads' },
      { key: 'leads_edit', name: 'Editar Leads', module: 'Leads' },
      { key: 'leads_delete', name: 'Excluir Leads', module: 'Leads' },
      { key: 'leads_convert', name: 'Converter Leads', module: 'Leads' },
      { key: 'leads_approve_conversion', name: 'Aprovar Conversão de Leads', module: 'Leads' },
      
      // Clientes
      { key: 'clients_view', name: 'Visualizar Clientes', module: 'Clientes' },
      { key: 'clients_create', name: 'Criar Clientes', module: 'Clientes' },
      { key: 'clients_edit', name: 'Editar Clientes', module: 'Clientes' },
      { key: 'clients_delete', name: 'Excluir Clientes', module: 'Clientes' },
      
      // Projetos
      { key: 'projects_view', name: 'Visualizar Projetos', module: 'Projetos' },
      { key: 'projects_create', name: 'Criar Projetos', module: 'Projetos' },
      { key: 'projects_edit', name: 'Editar Projetos', module: 'Projetos' },
      { key: 'projects_delete', name: 'Excluir Projetos', module: 'Projetos' },
      { key: 'projects_manage_tasks', name: 'Gerenciar Tarefas de Projetos', module: 'Projetos' },
      
      // Tarefas
      { key: 'tasks_view', name: 'Visualizar Tarefas', module: 'Tarefas' },
      { key: 'tasks_create', name: 'Criar Tarefas', module: 'Tarefas' },
      { key: 'tasks_edit', name: 'Editar Tarefas', module: 'Tarefas' },
      { key: 'tasks_delete', name: 'Excluir Tarefas', module: 'Tarefas' },
      
      // Implantação
      { key: 'implantacao_access', name: 'Acesso à Implantação', module: 'Implantação' },
      { key: 'implantacao_manage', name: 'Gerenciar Implantação', module: 'Implantação' },
      
      // Email Marketing
      { key: 'email_marketing_access', name: 'Acesso ao Email Marketing', module: 'Email Marketing' },
      { key: 'email_marketing_send', name: 'Enviar Emails', module: 'Email Marketing' },
      
      // Chat
      { key: 'chat_access', name: 'Acesso ao Chat', module: 'Chat' },
      
      // Relatórios
      { key: 'reports_view', name: 'Visualizar Relatórios', module: 'Relatórios' },
      { key: 'reports_export', name: 'Exportar Relatórios', module: 'Relatórios' }
    ];

    for (const permission of defaultPermissions) {
      await prisma.permission.upsert({
        where: { key: permission.key },
        update: {},
        create: permission
      });
    }

    // Criar roles padrão
    const defaultRoles = [
      {
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        color: '#f44336',
        isSystem: true,
        permissions: defaultPermissions.map(p => p.key)
      },
      {
        name: 'Diretor',
        description: 'Acesso gerencial completo',
        color: '#9c27b0',
        isSystem: true,
        permissions: [
          'admin_access', 'leads_view', 'leads_create', 'leads_edit', 'leads_delete',
          'leads_convert', 'leads_approve_conversion', 'clients_view', 'clients_create',
          'clients_edit', 'clients_delete', 'projects_view', 'projects_create',
          'projects_edit', 'projects_delete', 'projects_manage_tasks', 'tasks_view',
          'tasks_create', 'tasks_edit', 'tasks_delete', 'implantacao_access',
          'implantacao_manage', 'email_marketing_access', 'email_marketing_send',
          'chat_access', 'reports_view', 'reports_export'
        ]
      },
      {
        name: 'Gerente',
        description: 'Acesso de gerência departamental',
        color: '#3f51b5',
        isSystem: true,
        permissions: [
          'leads_view', 'leads_create', 'leads_edit', 'leads_convert',
          'clients_view', 'clients_create', 'clients_edit', 'projects_view',
          'projects_create', 'projects_edit', 'projects_manage_tasks',
          'tasks_view', 'tasks_create', 'tasks_edit', 'chat_access', 'reports_view'
        ]
      },
      {
        name: 'Vendedor',
        description: 'Acesso focado em vendas e leads',
        color: '#4caf50',
        isSystem: false,
        permissions: [
          'leads_view', 'leads_create', 'leads_edit', 'leads_convert',
          'clients_view', 'tasks_view', 'tasks_create', 'chat_access'
        ]
      },
      {
        name: 'Implantação',
        description: 'Acesso ao módulo de implantação',
        color: '#ff9800',
        isSystem: false,
        permissions: [
          'implantacao_access', 'implantacao_manage', 'projects_view',
          'projects_manage_tasks', 'tasks_view', 'tasks_create', 'tasks_edit',
          'clients_view', 'chat_access'
        ]
      }
    ];

    for (const roleData of defaultRoles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: {
          name: roleData.name,
          description: roleData.description,
          color: roleData.color,
          isSystem: roleData.isSystem
        }
      });

      // Adicionar permissões ao role
      for (const permissionKey of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { key: permissionKey }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }

    return { message: 'Sistema de permissões inicializado com sucesso' };
  }
} 