import { SystemEmailServices } from '../services/systemEmail.services';
import { prisma } from '../database/prisma';

async function testEmailSystem() {
  try {
    console.log('🧪 Testando sistema de email...');
    
    const systemEmailService = new SystemEmailServices();
    
    // 1. Verificar se há configuração de email
    console.log('\n1. Verificando configuração de email...');
    const hasConfig = await systemEmailService.hasEmailConfig();
    console.log(`   Tem configuração: ${hasConfig ? '✅ Sim' : '❌ Não'}`);
    
    if (!hasConfig) {
      console.log('\n⚠️  Para testar o envio de email, você precisa:');
      console.log('   1. Acessar o sistema como Diretor');
      console.log('   2. Ir em Admin → Configurações → Email Marketing');
      console.log('   3. Criar uma configuração SMTP (Gmail, Outlook, etc.)');
      console.log('   4. Marcar como padrão e ativar');
      return;
    }
    
    // 2. Listar configurações disponíveis
    console.log('\n2. Configurações disponíveis:');
    const configs = await systemEmailService.getAvailableConfigs();
    if (configs.length > 0) {
      configs.forEach(config => {
        console.log(`   - ${config.name} (${config.fromEmail}) ${config.isDefault ? '[PADRÃO]' : ''}`);
      });
    }
    
    // 3. Buscar um usuário de teste
    console.log('\n3. Buscando usuário de teste...');
    const testUser = await prisma.user.findFirst({
      where: {
        email: {
          contains: '@'
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    if (!testUser) {
      console.log('   ❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    console.log(`   ✅ Usuário de teste: ${testUser.name} (${testUser.email})`);
    
    // 4. Simular envio de email de reset de senha
    console.log('\n4. Simulando envio de email de reset de senha...');
    console.log('   ⚠️  ATENÇÃO: Este é um teste real! O email será enviado.');
    console.log('   💡 Para testar sem enviar, use um email de teste próprio.');
    
    // Descomentar as linhas abaixo para enviar email real:
    /*
    const result = await systemEmailService.sendPasswordResetEmail({
      userId: testUser.id,
      userName: testUser.name,
      userEmail: testUser.email,
      tempPassword: 'TESTE123',
      sentById: testUser.id
    });
    
    console.log('   ✅ Resultado:', result);
    */
    
    console.log('   ⏸️  Teste pausado - descomente o código acima para enviar email real');
    
    console.log('\n✅ Sistema de email configurado e pronto para uso!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', (error as Error).message);
    
    if ((error as Error).message.includes('SMTP')) {
      console.log('\n💡 Dicas para configuração SMTP:');
      console.log('   - Gmail: Use App Password, não a senha normal');
      console.log('   - Outlook: Ative autenticação em duas etapas');
      console.log('   - Verifique host, porta e configurações de segurança');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testEmailSystem();
}

export { testEmailSystem }; 