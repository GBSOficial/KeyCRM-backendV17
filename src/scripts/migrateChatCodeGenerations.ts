import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateChatCodeGenerations() {
  try {
    console.log('🚀 Iniciando migração do campo chatCodeGenerations...');

    // Verifica se o campo já existe
    const users = await prisma.user.findMany({
      select: { id: true, chatCode: true }
    });

    console.log(`📊 Encontrados ${users.length} usuários no banco de dados`);

    // Atualiza usuários que já têm chatCode para ter 1 geração usada
    const usersWithChatCode = users.filter(user => user.chatCode);
    
    if (usersWithChatCode.length > 0) {
      console.log(`🔄 Atualizando ${usersWithChatCode.length} usuários que já possuem código de chat...`);
      
      for (const user of usersWithChatCode) {
        await prisma.user.update({
          where: { id: user.id },
          data: { chatCodeGenerations: 1 }
        });
      }
      
      console.log('✅ Usuários com código existente atualizados para 1 geração usada');
    } else {
      console.log('ℹ️ Nenhum usuário com código de chat encontrado');
    }

    // Verifica o resultado final
    const finalCount = await prisma.user.count({
      where: { chatCodeGenerations: { gt: 0 } }
    });

    console.log(`📈 Total de usuários com gerações registradas: ${finalCount}`);
    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa a migração se o script for chamado diretamente
if (require.main === module) {
  migrateChatCodeGenerations()
    .then(() => {
      console.log('✨ Script de migração finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export { migrateChatCodeGenerations }; 