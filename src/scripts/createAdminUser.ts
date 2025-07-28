import { prisma } from '../database/prisma';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    console.log('🔍 Verificando usuários no banco...');
    
    // Verificar total de usuários
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total de usuários no banco: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('⚠️  Nenhum usuário encontrado. Criando usuário administrador...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@keycrm.com',
          password: hashedPassword,
          offices: 'Diretor',
          department: 'Diretoria',
          status: 'ACTIVE',
          chatCode: 'ADM#2024',
          chatCodeGenerations: 0
        }
      });
      
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('📧 Email: admin@keycrm.com');
      console.log('🔑 Senha: admin123');
      console.log(`🆔 ID: ${adminUser.id}`);
    } else {
      console.log('✅ Usuários encontrados no banco:');
      
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
        take: 5
      });
      
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}, Cargo: ${user.offices}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar/criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createAdminUser(); 