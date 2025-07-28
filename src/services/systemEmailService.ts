import nodemailer from "nodemailer";

export class SystemEmailService {
  private transporter: any;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configuração SMTP do sistema via .env
    const config = {
      host: process.env.SYSTEM_SMTP_HOST,
      port: parseInt(process.env.SYSTEM_SMTP_PORT || '587'),
      secure: process.env.SYSTEM_SMTP_SECURE === 'true',
      auth: {
        user: process.env.SYSTEM_SMTP_USER,
        pass: process.env.SYSTEM_SMTP_PASS
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    };

    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Verifica se o sistema de email está configurado
   */
  isConfigured(): boolean {
    return !!(
      process.env.SYSTEM_SMTP_HOST &&
      process.env.SYSTEM_SMTP_PORT &&
      process.env.SYSTEM_SMTP_USER &&
      process.env.SYSTEM_SMTP_PASS
    );
  }

  /**
   * Testa a conexão SMTP
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Configuração SMTP do sistema não encontrada no .env'
        };
      }

      await this.transporter.verify();
      return {
        success: true,
        message: 'Conexão SMTP do sistema testada com sucesso!'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        message: `Erro na conexão SMTP do sistema: ${errorMessage}`
      };
    }
  }

  /**
   * Envia email de reset de senha
   */
  async sendPasswordResetEmail(data: {
    userName: string;
    userEmail: string;
    tempPassword: string;
  }): Promise<{ success: boolean; messageId?: string; message: string }> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sistema de email não configurado. Configure as variáveis SYSTEM_SMTP_* no arquivo .env');
      }

      console.log('=== SYSTEM EMAIL SERVICE - PASSWORD RESET ===');
      console.log('Enviando para:', data.userEmail);

      // Template HTML para reset de senha
      const subject = "Reset de Senha - TheArc";
      const htmlContent = this.generatePasswordResetTemplate(data);

      // Configurar email
      const mailOptions = {
        from: `"${process.env.SYSTEM_SMTP_FROM_NAME || 'TheArc Sistema'}" <${process.env.SYSTEM_SMTP_FROM_EMAIL || process.env.SYSTEM_SMTP_USER}>`,
        to: `"${data.userName}" <${data.userEmail}>`,
        subject: subject,
        html: htmlContent
      };

      console.log('Enviando email com configuração do sistema...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log('Email enviado com sucesso:', result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de reset de senha enviado com sucesso via configuração do sistema'
      };

    } catch (error) {
      console.error('Erro ao enviar email de reset de senha:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao enviar email do sistema: ${errorMessage}`);
    }
  }

  /**
   * Envia email genérico do sistema
   */
  async sendSystemEmail(data: {
    to: string;
    toName: string;
    subject: string;
    htmlContent: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Sistema de email não configurado');
      }

      const mailOptions = {
        from: `"${process.env.SYSTEM_SMTP_FROM_NAME || 'TheArc Sistema'}" <${process.env.SYSTEM_SMTP_FROM_EMAIL || process.env.SYSTEM_SMTP_USER}>`,
        to: `"${data.toName}" <${data.to}>`,
        subject: data.subject,
        html: data.htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao enviar email do sistema: ${errorMessage}`);
    }
  }

  /**
   * Gera template HTML para reset de senha
   */
  private generatePasswordResetTemplate(data: {
    userName: string;
    userEmail: string;
    tempPassword: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset de Senha</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .password-box {
            background: #f8f9ff;
            border: 2px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
            border-radius: 8px;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 3px;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
          }
          .warning h3 {
            margin-top: 0;
            color: #856404;
          }
          .info-box {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
                     <div class="header">
             <h1>🔑 Reset de Senha</h1>
             <p>TheArc - Sistema de Gestão</p>
           </div>
          
          <div class="content">
            <h2>Olá, ${data.userName}!</h2>
            
            <p>Sua senha foi resetada por um administrador do sistema. Uma nova senha temporária foi gerada para você.</p>
            
            <p><strong>Sua nova senha temporária é:</strong></p>
            
            <div class="password-box">
              ${data.tempPassword}
            </div>
            
            <div class="warning">
              <h3>⚠️ Importante - Leia com Atenção:</h3>
              <ul>
                <li><strong>Esta é uma senha temporária</strong> - Você deve alterá-la após o primeiro login</li>
                <li><strong>Não compartilhe</strong> esta senha com ninguém</li>
                <li><strong>Use apenas uma vez</strong> para fazer login e criar sua nova senha</li>
                <li><strong>Esta senha expira</strong> em 24 horas por segurança</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>📋 Como fazer login:</h3>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Senha:</strong> Use a senha temporária acima</p>
            </div>
            
            <p>Após fazer login, vá em <strong>Perfil → Alterar Senha</strong> para definir uma nova senha segura.</p>
            
            <p>Se você não solicitou este reset ou tem dúvidas, entre em contato com o administrador do sistema imediatamente.</p>
            
                         <p>Atenciosamente,<br>
             <strong>Equipe TheArc</strong></p>
          </div>
          
                     <div class="footer">
             <p>Este é um email automático do sistema, não responda a esta mensagem.</p>
             <p>© ${new Date().getFullYear()} TheArc - Sistema de Gestão - Todos os direitos reservados</p>
           </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Retorna informações sobre a configuração atual
   */
  getConfigInfo() {
    return {
      configured: this.isConfigured(),
      host: process.env.SYSTEM_SMTP_HOST || 'Não configurado',
      port: process.env.SYSTEM_SMTP_PORT || 'Não configurado',
      user: process.env.SYSTEM_SMTP_USER || 'Não configurado',
      fromName: process.env.SYSTEM_SMTP_FROM_NAME || 'TheArc Sistema',
      fromEmail: process.env.SYSTEM_SMTP_FROM_EMAIL || process.env.SYSTEM_SMTP_USER || 'Não configurado'
    };
  }
} 