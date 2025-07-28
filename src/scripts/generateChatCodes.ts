import { PrismaClient } from '@prisma/client';
import { generateUniqueChatCode } from '../utils/chatCodeGenerator';

const prisma = new PrismaClient();

async function generateChatCodesForExistingUsers() {
  try {
    console.log('🔄 Iniciando geração de códigos de chat para usuários existentes...');

    // Busca usuários que não possuem código de chat
    const usersWithoutCode = await prisma.user.findMany({
      where: {
        OR: [
          { chatCode: null },
          { chatCode: '' }
        ]
      }
    });

    console.log(`📊 Encontrados ${usersWithoutCode.length} usuários sem código de chat`);

    if (usersWithoutCode.length === 0) {
      console.log('✅ Todos os usuários já possuem códigos de chat!');
      return;
    }

    // Gera códigos para cada usuário
    for (const user of usersWithoutCode) {
      try {
        const chatCode = await generateUniqueChatCode(user.name, prisma);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { chatCode }
        });

        console.log(`✅ Código gerado para ${user.name}: ${chatCode}`);
      } catch (error) {
        console.error(`❌ Erro ao gerar código para ${user.name}:`, error);
      }
    }

    console.log('🎉 Processo concluído!');
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script se for chamado diretamente
if (require.main === module) {
  generateChatCodesForExistingUsers();
}

export { generateChatCodesForExistingUsers }; 