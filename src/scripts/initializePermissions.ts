import { PermissionService } from '../services/permission.services';
import { prisma } from '../database/prismaClient';

async function initializePermissions() {
  try {
    console.log('🔐 Inicializando sistema de permissões...');
    
    const permissionService = new PermissionService();
    
    // Inicializar permissões e roles padrão
    await permissionService.initializeSystemPermissions();
    
    console.log('✅ Sistema de permissões inicializado com sucesso!');
    
    // Verificar se existe usuário admin
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { department: 'Diretoria' },
          { offices: { contains: 'Diretor' } }
        ]
      }
    });

    if (adminUser) {
      console.log(`👤 Usuário admin encontrado: ${adminUser.name} (${adminUser.email})`);
      
      // Atribuir role de Administrador ao usuário admin
      const adminRole = await prisma.role.findUnique({
        where: { name: 'Administrador' }
      });

      if (adminRole) {
        try {
          await permissionService.assignRoleToUser(adminUser.id, adminRole.id, adminUser.id);
          console.log('✅ Role de Administrador atribuída ao usuário admin');
        } catch (error: any) {
          if (error.message.includes('já possui esta função')) {
            console.log('ℹ️  Usuário admin já possui a função de Administrador');
          } else {
            console.error('❌ Erro ao atribuir role de admin:', error.message);
          }
        }
      }
    } else {
      console.log('⚠️  Nenhum usuário admin encontrado. Crie um usuário com departamento "Diretoria" ou cargo "Diretor"');
    }

    console.log('\n🎉 Inicialização concluída!');
    console.log('💡 Acesse /admin → Permissões & Níveis para gerenciar o sistema');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema de permissões:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializePermissions();
}

export { initializePermissions }; 