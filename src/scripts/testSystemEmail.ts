import { SystemEmailService } from '../services/systemEmailService';
import { prisma } from '../database/prisma';

async function testSystemEmail() {
  try {
    console.log('🧪 Testando Sistema de Email (via .env)...');
    console.log('========================================');
    
    const systemEmailService = new SystemEmailService();
    
    // 1. Verificar configuração
    console.log('\n1. 📋 Verificando configuração do .env...');
    const configInfo = systemEmailService.getConfigInfo();
    
    console.log(`   ✅ Configurado: ${configInfo.configured ? 'SIM' : 'NÃO'}`);
    console.log(`   🏠 Host: ${configInfo.host}`);
    console.log(`   🔌 Porta: ${configInfo.port}`);
    console.log(`   👤 Usuário: ${configInfo.user}`);
    console.log(`   📧 Nome: ${configInfo.fromName}`);
    console.log(`   📬 Email: ${configInfo.fromEmail}`);
    
    if (!configInfo.configured) {
      console.log('\n❌ Sistema não configurado!');
      console.log('\n📝 Para configurar, adicione no arquivo .env:');
      console.log('');
      console.log('# ===== EMAIL DO SISTEMA (Interno) =====');
      console.log('SYSTEM_SMTP_HOST=smtp.gmail.com');
      console.log('SYSTEM_SMTP_PORT=587');
      console.log('SYSTEM_SMTP_SECURE=false');
      console.log('SYSTEM_SMTP_USER=sistema@suaempresa.com');
      console.log('SYSTEM_SMTP_PASS=sua-senha-app');
             console.log('SYSTEM_SMTP_FROM_NAME=TheArc Sistema');
      console.log('SYSTEM_SMTP_FROM_EMAIL=noreply@suaempresa.com');
      console.log('');
      console.log('💡 Para Gmail, use App Password, não a senha normal!');
      return;
    }
    
    // 2. Testar conexão
    console.log('\n2. 🔗 Testando conexão SMTP...');
    const connectionTest = await systemEmailService.testConnection();
    
    if (connectionTest.success) {
      console.log(`   ✅ ${connectionTest.message}`);
    } else {
      console.log(`   ❌ ${connectionTest.message}`);
      console.log('\n💡 Dicas de troubleshooting:');
      console.log('   - Verifique host e porta');
      console.log('   - Para Gmail: Use App Password');
      console.log('   - Para Outlook: Ative 2FA e use senha de app');
      console.log('   - Verifique firewall/proxy');
      return;
    }
    
    // 3. Buscar usuário de teste
    console.log('\n3. 👤 Buscando usuário de teste...');
    const testUser = await prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        email: { contains: '@' }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    if (!testUser) {
      console.log('   ❌ Nenhum usuário ativo encontrado');
      return;
    }
    
    console.log(`   ✅ Usuário: ${testUser.name} (${testUser.email})`);
    
    // 4. Teste de envio (comentado por segurança)
    console.log('\n4. 📤 Teste de envio de email...');
    console.log('   ⚠️  ATENÇÃO: Este seria um envio real!');
    console.log('   💡 Para testar, descomente o código abaixo:');
    
    /*
    // DESCOMENTE PARA TESTAR ENVIO REAL:
    console.log('   📨 Enviando email de teste...');
    const emailResult = await systemEmailService.sendPasswordResetEmail({
      userName: testUser.name,
      userEmail: testUser.email,
      tempPassword: 'TESTE123'
    });
    
    console.log(`   ✅ Email enviado! ID: ${emailResult.messageId}`);
    console.log(`   📧 Para: ${testUser.email}`);
    */
    
    console.log('   ⏸️  Teste pausado por segurança');
    
    console.log('\n✅ Sistema de Email está funcionando!');
    console.log('========================================');
    console.log('🎯 O que você pode fazer agora:');
    console.log('   1. Resetar senha de usuário via Admin');
    console.log('   2. Email será enviado automaticamente');
    console.log('   3. Usuário receberá senha temporária');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('\n❌ Erro no teste:', errorMessage);
    
    if (errorMessage.includes('SMTP')) {
      console.log('\n🔧 Dicas para resolução:');
      console.log('   - Verifique as credenciais SMTP');
      console.log('   - Para Gmail: Use App Password');
      console.log('   - Para Outlook: Use senha de aplicativo');
      console.log('   - Verifique configurações de segurança');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSystemEmail();
}

export { testSystemEmail }; 