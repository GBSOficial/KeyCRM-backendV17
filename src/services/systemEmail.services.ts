import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { EmailConfigServices } from "./emailConfig.services";

const prisma = new PrismaClient();
const emailConfigServices = new EmailConfigServices();

export class SystemEmailServices {
  /**
   * Envia email de reset de senha
   */
  async sendPasswordResetEmail(data: {
    userId: number;
    userName: string;
    userEmail: string;
    tempPassword: string;
    sentById: number;
    configId?: number;
  }) {
    try {
      console.log('=== SYSTEM EMAIL SERVICE - PASSWORD RESET ===');
      console.log('Dados recebidos:', { ...data, tempPassword: '***' });

      // Buscar configuração SMTP
      let config;
      if (data.configId) {
        config = await emailConfigServices.findById(data.configId);
      } else {
        config = await emailConfigServices.findDefault();
      }

      if (!config) {
        throw new Error("Configuração SMTP não encontrada. Configure o sistema de email primeiro.");
      }

      // Template para reset de senha
      const subject = "Reset de Senha - KeyCRM";
      const htmlContent = `
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
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              border: 1px solid #ddd;
            }
            .password-box {
              background: #fff;
              border: 2px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
              border-radius: 8px;
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 2px;
              color: #667eea;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Reset de Senha</h1>
            <p>KeyCRM - Sistema de Gestão</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${data.userName}!</h2>
            
            <p>Sua senha foi resetada por um administrador do sistema.</p>
            
            <p>Sua nova senha temporária é:</p>
            
            <div class="password-box">
              ${data.tempPassword}
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Esta é uma senha temporária</li>
                <li>Recomendamos que você altere sua senha após o primeiro login</li>
                <li>Não compartilhe esta senha com ninguém</li>
                <li>Esta senha é válida apenas para o seu próximo login</li>
              </ul>
            </div>
            
            <p>Para fazer login, acesse o sistema com:</p>
            <ul>
              <li><strong>Email:</strong> ${data.userEmail}</li>
              <li><strong>Senha:</strong> A senha temporária acima</li>
            </ul>
            
            <p>Se você não solicitou este reset, entre em contato com o administrador do sistema imediatamente.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe KeyCRM</strong></p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático, não responda a esta mensagem.</p>
            <p>© ${new Date().getFullYear()} KeyCRM - Todos os direitos reservados</p>
          </div>
        </body>
        </html>
      `;

      // Configurar transporter
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      });

      // Enviar e-mail
      const mailOptions = {
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: `"${data.userName}" <${data.userEmail}>`,
        subject: subject,
        html: htmlContent
      };

      console.log('Enviando email com configuração:', { 
        host: config.host, 
        port: config.port, 
        from: config.fromEmail,
        to: data.userEmail 
      });

      const result = await transporter.sendMail(mailOptions);

      console.log('Email enviado com sucesso:', result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de reset de senha enviado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao enviar email de reset de senha:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao enviar email: ${errorMessage}`);
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
    sentById: number;
    configId?: number;
  }) {
    try {
      // Buscar configuração SMTP
      let config;
      if (data.configId) {
        config = await emailConfigServices.findById(data.configId);
      } else {
        config = await emailConfigServices.findDefault();
      }

      if (!config) {
        throw new Error("Configuração SMTP não encontrada");
      }

      // Configurar transporter
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password
        }
      });

      // Enviar e-mail
      const mailOptions = {
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: `"${data.toName}" <${data.to}>`,
        subject: data.subject,
        html: data.htmlContent
      };

      const result = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao enviar email: ${errorMessage}`);
    }
  }

  /**
   * Testa se existe configuração SMTP ativa
   */
  async hasEmailConfig(): Promise<boolean> {
    try {
      const config = await emailConfigServices.findDefault();
      return !!config;
    } catch (error) {
      return false;
    }
  }

  /**
   * Lista configurações de email disponíveis
   */
  async getAvailableConfigs(userId?: number, userOffices?: string) {
    try {
      return await emailConfigServices.findAll(
        { isActive: true }, 
        userId, 
        userOffices, 
        userOffices === 'Diretor'
      );
    } catch (error) {
      return [];
    }
  }
} 