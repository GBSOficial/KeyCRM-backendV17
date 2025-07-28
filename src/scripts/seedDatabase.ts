import { prisma } from '../database/prisma';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    
    // Verificar se já existem usuários
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('👤 Criando usuários de teste...');
      
      const password = await bcrypt.hash('123456', 10);
      
      // Criar usuário admin
      const admin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@keycrm.com',
          password,
          offices: 'Diretor',
          department: 'Diretoria',
          status: 'ACTIVE',
          chatCode: 'ADM#2024'
        }
      });
      
      // Criar usuários de exemplo
      const users = await Promise.all([
        prisma.user.create({
          data: {
            name: 'Gabriel Silva',
            email: 'gabriel@keycrm.com',
            password,
            offices: 'Consultor',
            department: 'Vendas',
            status: 'ACTIVE',
            chatCode: 'GS#2024',
            lastLogin: new Date()
          }
        }),
        prisma.user.create({
          data: {
            name: 'Maria Santos',
            email: 'maria@keycrm.com',
            password,
            offices: 'Gerente',
            department: 'Marketing',
            status: 'ACTIVE',
            chatCode: 'MS#2024',
            lastLogin: new Date(Date.now() - 3600000) // 1 hora atrás
          }
        }),
        prisma.user.create({
          data: {
            name: 'João Oliveira',
            email: 'joao@keycrm.com',
            password,
            offices: 'Analista',
            department: 'TI',
            status: 'ACTIVE',
            chatCode: 'JO#2024',
            lastLogin: new Date(Date.now() - 7200000) // 2 horas atrás
          }
        }),
        prisma.user.create({
          data: {
            name: 'Ana Costa',
            email: 'ana@keycrm.com',
            password,
            offices: 'Consultora',
            department: 'Vendas',
            status: 'INACTIVE',
            chatCode: 'AC#2024',
            lastLogin: new Date(Date.now() - 86400000) // 1 dia atrás
          }
        })
      ]);
      
      console.log(`✅ Criados ${users.length + 1} usuários (incluindo admin)`);
      
      // Criar alguns leads de exemplo
      console.log('📊 Criando leads de exemplo...');
      
      const leads = await Promise.all([
        prisma.lead.create({
          data: {
            name: 'Empresa ABC',
            email: 'contato@empresaabc.com',
            phone: '11999999999',
            company: 'Empresa ABC Ltda',
            status: 'NEW',
            source: 'Website',
            notes: 'Lead interessado em nossos serviços',
            userId: users[0].id,
            value: 5000
          }
        }),
        prisma.lead.create({
          data: {
            name: 'Startup XYZ',
            email: 'hello@startupxyz.com',
            phone: '11888888888',
            company: 'Startup XYZ',
            status: 'QUALIFIED',
            source: 'Indicação',
            notes: 'Lead qualificado para CRM',
            userId: users[1].id,
            value: 3000
          }
        })
      ]);
      
      console.log(`✅ Criados ${leads.length} leads`);
      
      // Criar alguns projetos de exemplo
      console.log('📁 Criando projetos de exemplo...');
      
      const projects = await Promise.all([
        prisma.project.create({
          data: {
            title: 'Implementação CRM - Empresa ABC',
            description: 'Projeto de implementação do sistema CRM para a Empresa ABC',
            status: 'EM_PROGRESSO',
            priority: 'ALTA',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            clientId: 1 // Assumindo que haverá cliente
          }
        })
      ]);
      
      console.log(`✅ Criados ${projects.length} projetos`);
      
      console.log('🎉 Seed concluído com sucesso!');
      console.log('📧 Email admin: admin@keycrm.com');
      console.log('🔑 Senha padrão: 123456');
      
    } else {
      console.log(`ℹ️  Banco já possui ${userCount} usuários. Seed não executado.`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seedDatabase(); 