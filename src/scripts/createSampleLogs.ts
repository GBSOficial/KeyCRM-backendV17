import { prisma } from '../database/prisma';

async function createSampleLogs() {
  try {
    console.log('🔄 Criando logs de exemplo...');
    
    // Verificar se os usuários existem
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      take: 5
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Execute o seed primeiro.');
      return;
    }
    
    try {
      // Tentar criar logs usando o novo sistema
      const { SystemLogService } = await import('../services/systemLog.services');
      
      // Criar logs de diferentes tipos
      const logPromises = [];
      
      // Logs de login
      users.forEach((user, index) => {
        const loginTime = new Date(Date.now() - index * 3600000); // Horas diferentes
        logPromises.push(
          SystemLogService.createLog({
            level: 'SUCCESS',
            action: 'LOGIN',
            message: `Usuário ${user.name} fez login no sistema`,
            userId: user.id
          })
        );
      });
      
      // Logs de atividades
      logPromises.push(
        SystemLogService.createLog({
          level: 'INFO',
          action: 'CREATE_LEAD',
          message: 'Novo lead criado no sistema',
          userId: users[0].id,
          targetId: '1',
          targetType: 'LEAD'
        })
      );
      
      logPromises.push(
        SystemLogService.createLog({
          level: 'INFO',
          action: 'UPDATE_USER',
          message: 'Perfil de usuário atualizado',
          userId: users[1].id,
          targetId: users[0].id.toString(),
          targetType: 'USER',
          details: { field: 'phone', oldValue: '', newValue: '11999999999' }
        })
      );
      
      logPromises.push(
        SystemLogService.createLog({
          level: 'WARN',
          action: 'SECURITY_ALERT',
          message: 'Tentativa de acesso com credenciais inválidas',
          details: { attempts: 3, ip: '192.168.1.100' }
        })
      );
      
      logPromises.push(
        SystemLogService.createLog({
          level: 'ERROR',
          action: 'SYSTEM_ERROR',
          message: 'Erro de conexão com banco de dados',
          details: { error: 'Connection timeout', duration: '5s' }
        })
      );
      
      logPromises.push(
        SystemLogService.createLog({
          level: 'INFO',
          action: 'CREATE_PROJECT',
          message: 'Novo projeto criado',
          userId: users[2].id,
          targetId: '1',
          targetType: 'PROJECT'
        })
      );
      
      await Promise.all(logPromises);
      
      console.log(`✅ ${logPromises.length} logs de exemplo criados!`);
      
    } catch (systemLogError) {
      console.log('⚠️  SystemLog não disponível ainda. Criando via SQL direto...');
      
      // Fallback: inserir logs diretamente (assumindo que a migration foi executada)
      try {
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          await prisma.$executeRaw`
            INSERT INTO "SystemLog" (level, action, message, "userId", "createdAt")
            VALUES ('SUCCESS', 'LOGIN', ${`Usuário ${user.name} fez login no sistema`}, ${user.id}, ${new Date(Date.now() - i * 3600000)})
          `;
        }
        
        // Alguns logs extras
        await prisma.$executeRaw`
          INSERT INTO "SystemLog" (level, action, message, "userId", "targetId", "targetType", "createdAt")
          VALUES ('INFO', 'CREATE_LEAD', 'Novo lead criado no sistema', ${users[0].id}, '1', 'LEAD', ${new Date()})
        `;
        
        await prisma.$executeRaw`
          INSERT INTO "SystemLog" (level, action, message, "createdAt")
          VALUES ('WARN', 'SECURITY_ALERT', 'Tentativa de acesso com credenciais inválidas', ${new Date(Date.now() - 1800000)})
        `;
        
        console.log('✅ Logs criados via SQL direto!');
        
      } catch (sqlError) {
        console.log('❌ Tabela SystemLog ainda não existe. Execute a migration primeiro.');
        console.log('Execute: npx prisma migrate dev --name add_system_logs');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar logs de exemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
createSampleLogs(); 