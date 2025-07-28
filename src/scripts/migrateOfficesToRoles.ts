import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de offices (cargos atuais) para roles
const OFFICE_TO_ROLE_MAPPING: Record<string, {
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  permissions: string[];
}> = {
  'Diretor': {
    name: 'Diretor',
    description: 'Diretor da empresa com acesso total',
    color: '#F44336',
    isSystem: true,
    permissions: [
      'admin_access', 'admin_users', 'admin_roles', 'admin_permissions', 'admin_settings',
      'leads_view', 'leads_create', 'leads_edit', 'leads_delete', 'leads_assign', 'leads_view_all',
      'tasks_view', 'tasks_create', 'tasks_edit', 'tasks_delete', 'tasks_assign', 'tasks_view_all',
      'projects_view', 'projects_create', 'projects_edit', 'projects_delete', 'projects_assign',
      'email_view', 'email_create', 'email_send', 'email_config', 'email_templates',
      'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
      'implantacao_access', 'reports_view', 'reports_export'
    ]
  },
  'Gerente': {
    name: 'Gerente',
    description: 'Gerente com acesso de supervisão',
    color: '#2196F3',
    isSystem: true,
    permissions: [
      'leads_view', 'leads_create', 'leads_edit', 'leads_assign', 'leads_view_all',
      'tasks_view', 'tasks_create', 'tasks_edit', 'tasks_assign', 'tasks_view_all',
      'projects_view', 'projects_create', 'projects_edit', 'projects_assign',
      'email_view', 'email_create', 'email_send', 'email_templates',
      'clients_view', 'clients_create', 'clients_edit',
      'reports_view'
    ]
  },
  'Coordenador': {
    name: 'Coordenador',
    description: 'Coordenador de equipe',
    color: '#4CAF50',
    isSystem: true,
    permissions: [
      'leads_view', 'leads_create', 'leads_edit', 'leads_assign',
      'tasks_view', 'tasks_create', 'tasks_edit', 'tasks_assign',
      'projects_view', 'projects_edit',
      'email_view', 'email_create', 'email_send',
      'clients_view', 'clients_edit'
    ]
  },
  'Analista': {
    name: 'Analista',
    description: 'Analista com acesso operacional',
    color: '#FF9800',
    isSystem: true,
    permissions: [
      'leads_view', 'leads_create', 'leads_edit',
      'tasks_view', 'tasks_create', 'tasks_edit',
      'projects_view',
      'email_view', 'email_create',
      'clients_view', 'clients_edit'
    ]
  },
  'Vendedor': {
    name: 'Vendedor',
    description: 'Vendedor com foco em leads e clientes',
    color: '#9C27B0',
    isSystem: true,
    permissions: [
      'leads_view', 'leads_create', 'leads_edit',
      'tasks_view', 'tasks_create', 'tasks_edit',
      'email_view', 'email_create',
      'clients_view', 'clients_create', 'clients_edit'
    ]
  },
  'ADMIN': {
    name: 'Administrador',
    description: 'Administrador do sistema',
    color: '#F44336',
    isSystem: true,
    permissions: [
      'admin_access', 'admin_users', 'admin_roles', 'admin_permissions', 'admin_settings',
      'leads_view', 'leads_create', 'leads_edit', 'leads_delete', 'leads_assign', 'leads_view_all',
      'tasks_view', 'tasks_create', 'tasks_edit', 'tasks_delete', 'tasks_assign', 'tasks_view_all',
      'projects_view', 'projects_create', 'projects_edit', 'projects_delete', 'projects_assign',
      'email_view', 'email_create', 'email_send', 'email_config', 'email_templates',
      'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
      'implantacao_access', 'reports_view', 'reports_export'
    ]
  }
};

// Permissões base do sistema
const BASE_PERMISSIONS = [
  // Admin
  { key: 'admin_access', name: 'Acesso ao Painel Admin', description: 'Pode acessar o painel administrativo', module: 'Admin' },
  { key: 'admin_users', name: 'Gerenciar Usuários', description: 'Pode gerenciar usuários do sistema', module: 'Admin' },
  { key: 'admin_roles', name: 'Gerenciar Cargos', description: 'Pode gerenciar cargos e funções', module: 'Admin' },
  { key: 'admin_permissions', name: 'Gerenciar Permissões', description: 'Pode gerenciar permissões do sistema', module: 'Admin' },
  { key: 'admin_settings', name: 'Configurações Sistema', description: 'Pode alterar configurações do sistema', module: 'Admin' },
  
  // Leads
  { key: 'leads_view', name: 'Visualizar Leads', description: 'Pode visualizar leads', module: 'Leads' },
  { key: 'leads_create', name: 'Criar Leads', description: 'Pode criar novos leads', module: 'Leads' },
  { key: 'leads_edit', name: 'Editar Leads', description: 'Pode editar leads', module: 'Leads' },
  { key: 'leads_delete', name: 'Excluir Leads', description: 'Pode excluir leads', module: 'Leads' },
  { key: 'leads_assign', name: 'Atribuir Leads', description: 'Pode atribuir leads a outros usuários', module: 'Leads' },
  { key: 'leads_view_all', name: 'Ver Todos os Leads', description: 'Pode ver leads de todos os usuários', module: 'Leads' },
  
  // Tasks
  { key: 'tasks_view', name: 'Visualizar Tarefas', description: 'Pode visualizar tarefas', module: 'Tarefas' },
  { key: 'tasks_create', name: 'Criar Tarefas', description: 'Pode criar novas tarefas', module: 'Tarefas' },
  { key: 'tasks_edit', name: 'Editar Tarefas', description: 'Pode editar tarefas', module: 'Tarefas' },
  { key: 'tasks_delete', name: 'Excluir Tarefas', description: 'Pode excluir tarefas', module: 'Tarefas' },
  { key: 'tasks_assign', name: 'Atribuir Tarefas', description: 'Pode atribuir tarefas a usuários', module: 'Tarefas' },
  { key: 'tasks_view_all', name: 'Ver Todas as Tarefas', description: 'Pode ver tarefas de todos os usuários', module: 'Tarefas' },
  
  // Projects
  { key: 'projects_view', name: 'Visualizar Projetos', description: 'Pode visualizar projetos', module: 'Projetos' },
  { key: 'projects_create', name: 'Criar Projetos', description: 'Pode criar novos projetos', module: 'Projetos' },
  { key: 'projects_edit', name: 'Editar Projetos', description: 'Pode editar projetos', module: 'Projetos' },
  { key: 'projects_delete', name: 'Excluir Projetos', description: 'Pode excluir projetos', module: 'Projetos' },
  { key: 'projects_assign', name: 'Atribuir Usuários', description: 'Pode atribuir usuários a projetos', module: 'Projetos' },
  
  // Email
  { key: 'email_view', name: 'Visualizar Campanhas', description: 'Pode visualizar campanhas de email', module: 'Email Marketing' },
  { key: 'email_create', name: 'Criar Campanhas', description: 'Pode criar campanhas de email', module: 'Email Marketing' },
  { key: 'email_send', name: 'Enviar Campanhas', description: 'Pode enviar campanhas de email', module: 'Email Marketing' },
  { key: 'email_config', name: 'Configurar SMTP', description: 'Pode configurar servidor SMTP', module: 'Email Marketing' },
  { key: 'email_templates', name: 'Gerenciar Templates', description: 'Pode criar e editar templates', module: 'Email Marketing' },
  
  // Clients
  { key: 'clients_view', name: 'Visualizar Clientes', description: 'Pode visualizar clientes', module: 'Clientes' },
  { key: 'clients_create', name: 'Criar Clientes', description: 'Pode criar novos clientes', module: 'Clientes' },
  { key: 'clients_edit', name: 'Editar Clientes', description: 'Pode editar clientes', module: 'Clientes' },
  { key: 'clients_delete', name: 'Excluir Clientes', description: 'Pode excluir clientes', module: 'Clientes' },
  
  // Implantação
  { key: 'implantacao_access', name: 'Acesso Implantação', description: 'Pode acessar módulo de implantação', module: 'Implantação' },
  
  // Reports
  { key: 'reports_view', name: 'Visualizar Relatórios', description: 'Pode visualizar relatórios', module: 'Relatórios' },
  { key: 'reports_export', name: 'Exportar Relatórios', description: 'Pode exportar relatórios', module: 'Relatórios' }
];

async function migrateOfficesToRoles() {
  console.log('🚀 Iniciando migração segura de offices para roles...');
  
  try {
    // 1. Criar permissões base (se não existirem)
    console.log('📝 Criando permissões base...');
    for (const permission of BASE_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: permission.key },
        update: {},
        create: permission
      });
    }
    console.log(`✅ ${BASE_PERMISSIONS.length} permissões criadas/verificadas`);

    // 2. Buscar todos os usuários existentes
    console.log('👥 Buscando usuários existentes...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        offices: true,
        department: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    console.log(`📊 Encontrados ${users.length} usuários`);

    // 3. Mapear offices únicos
    const uniqueOffices = [...new Set(users.map(u => u.offices).filter(Boolean))];
    console.log('🏢 Cargos únicos encontrados:', uniqueOffices);

    // 4. Criar roles baseados nos offices existentes
    console.log('🎭 Criando roles baseados nos cargos existentes...');
    const createdRoles = new Map();
    
    for (const office of uniqueOffices) {
      const roleData = OFFICE_TO_ROLE_MAPPING[office] || {
        name: office,
        description: `Cargo: ${office}`,
        color: '#607D8B',
        isSystem: false,
        permissions: ['leads_view', 'tasks_view', 'projects_view', 'clients_view'] // Permissões básicas
      };

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
      
      createdRoles.set(office, role);
      console.log(`✅ Role criado: ${role.name}`);

      // Associar permissões ao role
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

    // 5. Associar usuários aos roles (SEM REMOVER offices)
    console.log('🔗 Associando usuários aos roles...');
    let migratedUsers = 0;
    
    for (const user of users) {
      if (user.offices && !user.userRoles.length) { // Só migra se ainda não tem roles
        const role = createdRoles.get(user.offices);
        
        if (role) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id
            }
          });
          migratedUsers++;
          console.log(`✅ Usuário ${user.name} associado ao role ${role.name}`);
        }
      }
    }

    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO:');
    console.log(`✅ Permissões criadas: ${BASE_PERMISSIONS.length}`);
    console.log(`✅ Roles criados: ${createdRoles.size}`);
    console.log(`✅ Usuários migrados: ${migratedUsers}`);
    console.log(`✅ Total de usuários: ${users.length}`);
    
    console.log('\n🛡️ DADOS PRESERVADOS:');
    console.log('✅ Campo offices mantido em todos os usuários');
    console.log('✅ Campo department mantido em todos os usuários');
    console.log('✅ Sistema pode funcionar com ambos simultaneamente');
    
    console.log('\n🚀 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('💡 O sistema agora funciona com offices E roles simultaneamente');
    console.log('💡 Nenhum dado foi perdido, apenas adicionados novos');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função para verificar status da migração
async function checkMigrationStatus() {
  console.log('🔍 Verificando status da migração...');
  
  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.userRole.count(),
    prisma.user.count({ where: { offices: { not: '' } } }),
    prisma.user.count({ where: { userRoles: { some: {} } } })
  ]);
  
  console.log('\n📊 STATUS ATUAL:');
  console.log(`👥 Total de usuários: ${stats[0]}`);
  console.log(`🎭 Total de roles: ${stats[1]}`);
  console.log(`🔑 Total de permissões: ${stats[2]}`);
  console.log(`🔗 Total de associações user-role: ${stats[3]}`);
  console.log(`🏢 Usuários com offices: ${stats[4]}`);
  console.log(`🎭 Usuários com roles: ${stats[5]}`);
  
  await prisma.$disconnect();
}

// Executar migração
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    checkMigrationStatus();
  } else {
    migrateOfficesToRoles();
  }
}

export { migrateOfficesToRoles, checkMigrationStatus }; 