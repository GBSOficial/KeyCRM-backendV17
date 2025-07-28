import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPermissions() {
  console.log('🧪 Testando Sistema de Permissões...\n');

  try {
    // 1. Buscar um usuário com role "Diretor"
    console.log('1. 👑 Testando usuário Diretor...');
    const directorUser = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'Diretor'
            }
          }
        }
      },
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
        }
      }
    });

    if (directorUser) {
      console.log(`✅ Usuário encontrado: ${directorUser.name}`);
      console.log(`📧 Email: ${directorUser.email}`);
      console.log(`🏢 Cargo antigo (offices): ${directorUser.offices}`);
      
      const roles = directorUser.userRoles.map(ur => ur.role.name);
      console.log(`🎭 Roles: ${roles.join(', ')}`);
      
      const permissions = directorUser.userRoles.flatMap(ur => 
        ur.role.rolePermissions.map(rp => rp.permission.key)
      );
      console.log(`🔑 Permissões (${permissions.length}): ${permissions.slice(0, 5).join(', ')}...`);
    } else {
      console.log('❌ Nenhum usuário com role Diretor encontrado');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Listar todos os roles e suas permissões
    console.log('2. 🎭 Listando todos os roles...');
    const roles = await prisma.role.findMany({
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
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    roles.forEach(role => {
      console.log(`\n🎭 Role: ${role.name}`);
      console.log(`📝 Descrição: ${role.description}`);
      console.log(`🎨 Cor: ${role.color}`);
      console.log(`🔧 Sistema: ${role.isSystem ? 'Sim' : 'Não'}`);
      console.log(`👥 Usuários (${role.userRoles.length}): ${role.userRoles.map(ur => ur.user.name).join(', ')}`);
      console.log(`🔑 Permissões (${role.rolePermissions.length}): ${role.rolePermissions.slice(0, 3).map(rp => rp.permission.name).join(', ')}${role.rolePermissions.length > 3 ? '...' : ''}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Testar função de verificação de permissão
    console.log('3. 🔍 Testando verificação de permissões...');
    
    if (directorUser) {
      const testPermissions = ['admin_access', 'leads_view_all', 'tasks_create', 'invalid_permission'];
      
      for (const permission of testPermissions) {
        const hasPermission = await checkUserPermission(directorUser.id, permission);
        console.log(`${hasPermission ? '✅' : '❌'} ${directorUser.name} ${hasPermission ? 'TEM' : 'NÃO TEM'} permissão: ${permission}`);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. Estatísticas gerais
    console.log('4. 📊 Estatísticas do Sistema...');
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.userRole.count(),
      prisma.rolePermission.count()
    ]);

    console.log(`👥 Total de usuários: ${stats[0]}`);
    console.log(`🎭 Total de roles: ${stats[1]}`);
    console.log(`🔑 Total de permissões: ${stats[2]}`);
    console.log(`🔗 Associações usuário-role: ${stats[3]}`);
    console.log(`🔗 Associações role-permissão: ${stats[4]}`);

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Função auxiliar para verificar permissões
async function checkUserPermission(userId: number, permissionKey: string): Promise<boolean> {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        permission: { key: permissionKey },
        role: {
          userRoles: {
            some: { userId }
          }
        }
      }
    });

    const directPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        granted: true,
        permission: { key: permissionKey }
      }
    });

    return rolePermissions.length > 0 || directPermissions.length > 0;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testPermissions();
}

export { testPermissions }; 