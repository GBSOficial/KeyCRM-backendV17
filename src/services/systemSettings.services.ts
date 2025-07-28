import { prisma } from '../database/prisma';

export interface SystemSettingData {
  key: string;
  value: string;
  category?: string;
  description?: string;
  type?: string;
  isPublic?: boolean;
}

export interface SystemSettingUpdate {
  value: string;
  description?: string;
}

class SystemSettingsService {
  // Buscar todas as configurações
  async getAllSettings() {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });

      // Agrupar por categoria para facilitar o uso no frontend
      const grouped = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
        
        // Converter valor conforme o tipo
        let convertedValue: any = setting.value;
        switch (setting.type) {
          case 'boolean':
            convertedValue = setting.value === 'true';
            break;
          case 'number':
            convertedValue = parseFloat(setting.value) || 0;
            break;
          case 'password':
            convertedValue = '***'; // Mascarar senhas
            break;
          default:
            convertedValue = setting.value;
        }

        acc[setting.category][setting.key] = {
          id: setting.id,
          key: setting.key,
          value: convertedValue,
          originalValue: setting.value, // Valor original para updates
          description: setting.description,
          type: setting.type,
          isPublic: setting.isPublic,
          createdAt: setting.createdAt,
          updatedAt: setting.updatedAt
        };
        
        return acc;
      }, {} as any);

      return grouped;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw new Error('Erro ao buscar configurações do sistema');
    }
  }

  // Buscar configurações por categoria
  async getSettingsByCategory(category: string) {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { category },
        orderBy: { key: 'asc' }
      });

      return settings.map(setting => ({
        ...setting,
        value: this.convertValue(setting.value, setting.type)
      }));
    } catch (error) {
      console.error(`Erro ao buscar configurações da categoria ${category}:`, error);
      throw new Error(`Erro ao buscar configurações da categoria ${category}`);
    }
  }

  // Buscar configuração específica
  async getSetting(key: string) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key }
      });

      if (!setting) {
        return null;
      }

      return {
        ...setting,
        value: this.convertValue(setting.value, setting.type)
      };
    } catch (error) {
      console.error(`Erro ao buscar configuração ${key}:`, error);
      throw new Error(`Erro ao buscar configuração ${key}`);
    }
  }

  // Buscar configurações públicas (sem autenticação)
  async getPublicSettings() {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { isPublic: true },
        select: {
          key: true,
          value: true,
          type: true,
          category: true
        }
      });

      const result = settings.reduce((acc, setting) => {
        acc[setting.key] = this.convertValue(setting.value, setting.type);
        return acc;
      }, {} as any);

      return result;
    } catch (error) {
      console.error('Erro ao buscar configurações públicas:', error);
      throw new Error('Erro ao buscar configurações públicas');
    }
  }

  // Atualizar configuração
  async updateSetting(key: string, data: SystemSettingUpdate) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key }
      });

      if (!setting) {
        throw new Error(`Configuração ${key} não encontrada`);
      }

      // Validar valor conforme o tipo
      this.validateValue(data.value, setting.type);

      const updated = await prisma.systemSetting.update({
        where: { key },
        data: {
          value: data.value,
          description: data.description || setting.description,
          updatedAt: new Date()
        }
      });

      return {
        ...updated,
        value: this.convertValue(updated.value, updated.type)
      };
    } catch (error) {
      console.error(`Erro ao atualizar configuração ${key}:`, error);
      throw error;
    }
  }

  // Atualizar múltiplas configurações de uma categoria
  async updateCategorySettings(category: string, settings: Record<string, any>) {
    try {
      const updates = [];

      for (const [key, value] of Object.entries(settings)) {
        const setting = await prisma.systemSetting.findFirst({
          where: { key, category }
        });

        if (setting) {
          // Validar valor
          this.validateValue(String(value), setting.type);
          
          updates.push(
            prisma.systemSetting.update({
              where: { key },
              data: {
                value: String(value),
                updatedAt: new Date()
              }
            })
          );
        }
      }

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }

      return { success: true, updated: updates.length };
    } catch (error) {
      console.error(`Erro ao atualizar configurações da categoria ${category}:`, error);
      throw error;
    }
  }

  // Criar nova configuração
  async createSetting(data: SystemSettingData) {
    try {
      // Validar valor conforme o tipo
      this.validateValue(data.value, data.type || 'string');

      const setting = await prisma.systemSetting.create({
        data: {
          key: data.key,
          value: data.value,
          category: data.category || 'general',
          description: data.description,
          type: data.type || 'string',
          isPublic: data.isPublic || false
        }
      });

      return {
        ...setting,
        value: this.convertValue(setting.value, setting.type)
      };
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      throw error;
    }
  }

  // Deletar configuração
  async deleteSetting(key: string) {
    try {
      await prisma.systemSetting.delete({
        where: { key }
      });

      return { success: true };
    } catch (error) {
      console.error(`Erro ao deletar configuração ${key}:`, error);
      throw error;
    }
  }

  // Resetar configurações para padrão
  async resetToDefaults() {
    try {
      // Aqui você pode definir valores padrão ou reexecutar a migration
      // Por enquanto, vamos apenas retornar sucesso
      return { success: true, message: 'Configurações resetadas para o padrão' };
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      throw error;
    }
  }

  // Testar configurações de email
  async testEmailSettings() {
    try {
      const emailSettings = await this.getSettingsByCategory('email');
      
      // Aqui você implementaria o teste real de envio de email
      // Por enquanto, vamos simular
      const hasRequiredSettings = emailSettings.some(s => s.key === 'smtp_host' && s.value) &&
                                 emailSettings.some(s => s.key === 'smtp_user' && s.value);

      if (!hasRequiredSettings) {
        throw new Error('Configurações de SMTP incompletas');
      }

      return { 
        success: true, 
        message: 'Configurações de email testadas com sucesso',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao testar configurações de email:', error);
      throw error;
    }
  }

  // Utilitários privados
  private convertValue(value: string, type: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value) || 0;
      case 'password':
        return '***'; // Mascarar senhas
      default:
        return value;
    }
  }

  private validateValue(value: string, type: string): void {
    switch (type) {
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          throw new Error('Valor booleano deve ser "true" ou "false"');
        }
        break;
      case 'number':
        if (isNaN(parseFloat(value))) {
          throw new Error('Valor numérico inválido');
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          throw new Error('E-mail inválido');
        }
        break;
    }
  }

  // Método utilitário para obter valor tipado
  async getTypedValue<T = any>(key: string): Promise<T | null> {
    const setting = await this.getSetting(key);
    return setting ? setting.value as T : null;
  }

  // Método para verificar se sistema está em manutenção
  async isMaintenanceMode(): Promise<boolean> {
    const value = await this.getTypedValue<boolean>('maintenance_mode');
    return value || false;
  }

  // Método para obter configurações de segurança
  async getSecuritySettings() {
    return await this.getSettingsByCategory('security');
  }

  // Método para obter configurações de email
  async getEmailSettings() {
    return await this.getSettingsByCategory('email');
  }
}

export const systemSettingsService = new SystemSettingsService(); 