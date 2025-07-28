import { Request, Response } from 'express';
import { systemSettingsService } from '../services/systemSettings.services';
import { AppError } from '../errors/appError';

class SystemSettingsController {

  // GET /settings - Buscar todas as configurações
  async getAllSettings(req: Request, res: Response) {
    try {
      const settings = await systemSettingsService.getAllSettings();
      
      res.json({
        success: true,
        data: settings,
        message: 'Configurações carregadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw new AppError(500, 'Erro ao carregar configurações');
    }
  }

  // GET /settings/category/:category - Buscar configurações por categoria
  async getSettingsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const settings = await systemSettingsService.getSettingsByCategory(category);
      
      res.json({
        success: true,
        data: settings,
        message: `Configurações da categoria ${category} carregadas com sucesso`
      });
    } catch (error) {
      console.error('Erro ao buscar configurações por categoria:', error);
      throw new AppError(500, 'Erro ao carregar configurações da categoria');
    }
  }

  // GET /settings/public - Buscar configurações públicas (sem auth)
  async getPublicSettings(req: Request, res: Response) {
    try {
      const settings = await systemSettingsService.getPublicSettings();
      
      res.json({
        success: true,
        data: settings,
        message: 'Configurações públicas carregadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar configurações públicas:', error);
      throw new AppError(500, 'Erro ao carregar configurações públicas');
    }
  }

  // GET /settings/:key - Buscar configuração específica
  async getSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const setting = await systemSettingsService.getSetting(key);
      
      if (!setting) {
        throw new AppError(404, 'Configuração não encontrada');
      }
      
      res.json({
        success: true,
        data: setting,
        message: 'Configuração carregada com sucesso'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar configuração:', error);
      throw new AppError(500, 'Erro ao carregar configuração');
    }
  }

  // PUT /settings/:key - Atualizar configuração específica
  async updateSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      if (value === undefined) {
        throw new AppError(400, 'Valor é obrigatório');
      }

      const setting = await systemSettingsService.updateSetting(key, {
        value: String(value),
        description
      });
      
      res.json({
        success: true,
        data: setting,
        message: 'Configuração atualizada com sucesso'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar configuração:', error);
      throw new AppError(500, (error as Error).message || 'Erro ao atualizar configuração');
    }
  }

  // PUT /settings/category/:category - Atualizar múltiplas configurações de uma categoria
  async updateCategorySettings(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const settings = req.body;

      if (!settings || typeof settings !== 'object') {
        throw new AppError(400, 'Configurações são obrigatórias');
      }

      const result = await systemSettingsService.updateCategorySettings(category, settings);
      
      res.json({
        success: true,
        data: result,
        message: `${result.updated} configurações da categoria ${category} atualizadas com sucesso`
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar configurações da categoria:', error);
      throw new AppError(500, (error as Error).message || 'Erro ao atualizar configurações da categoria');
    }
  }

  // POST /settings - Criar nova configuração
  async createSetting(req: Request, res: Response) {
    try {
      const { key, value, category, description, type, isPublic } = req.body;

      if (!key || value === undefined) {
        throw new AppError(400, 'Chave e valor são obrigatórios');
      }

      const setting = await systemSettingsService.createSetting({
        key,
        value: String(value),
        category,
        description,
        type,
        isPublic
      });
      
      res.status(201).json({
        success: true,
        data: setting,
        message: 'Configuração criada com sucesso'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao criar configuração:', error);
      throw new AppError(500, (error as Error).message || 'Erro ao criar configuração');
    }
  }

  // DELETE /settings/:key - Deletar configuração
  async deleteSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      
      await systemSettingsService.deleteSetting(key);
      
      res.json({
        success: true,
        message: 'Configuração deletada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar configuração:', error);
      throw new AppError(500, 'Erro ao deletar configuração');
    }
  }

  // POST /settings/reset - Resetar para configurações padrão
  async resetToDefaults(req: Request, res: Response) {
    try {
      const result = await systemSettingsService.resetToDefaults();
      
      res.json({
        success: true,
        data: result,
        message: 'Configurações resetadas para o padrão com sucesso'
      });
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      throw new AppError(500, 'Erro ao resetar configurações');
    }
  }

  // POST /settings/test-email - Testar configurações de email
  async testEmailSettings(req: Request, res: Response) {
    try {
      const result = await systemSettingsService.testEmailSettings();
      
      res.json({
        success: true,
        data: result,
        message: 'Teste de email realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao testar configurações de email:', error);
      throw new AppError(500, (error as Error).message || 'Erro ao testar configurações de email');
    }
  }

  // GET /settings/maintenance/status - Verificar status de manutenção
  async getMaintenanceStatus(req: Request, res: Response) {
    try {
      const isMaintenanceMode = await systemSettingsService.isMaintenanceMode();
      
      res.json({
        success: true,
        data: { maintenanceMode: isMaintenanceMode },
        message: 'Status de manutenção verificado'
      });
    } catch (error) {
      console.error('Erro ao verificar status de manutenção:', error);
      throw new AppError(500, 'Erro ao verificar status de manutenção');
    }
  }

  // GET /settings/security - Buscar configurações de segurança
  async getSecuritySettings(req: Request, res: Response) {
    try {
      const settings = await systemSettingsService.getSecuritySettings();
      
      res.json({
        success: true,
        data: settings,
        message: 'Configurações de segurança carregadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar configurações de segurança:', error);
      throw new AppError(500, 'Erro ao carregar configurações de segurança');
    }
  }

  // GET /settings/email - Buscar configurações de email
  async getEmailSettings(req: Request, res: Response) {
    try {
      const settings = await systemSettingsService.getEmailSettings();
      
      res.json({
        success: true,
        data: settings,
        message: 'Configurações de email carregadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar configurações de email:', error);
      throw new AppError(500, 'Erro ao carregar configurações de email');
    }
  }

  // PUT /settings/bulk - Atualização em massa de configurações
  async bulkUpdateSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body;

      if (!settings || !Array.isArray(settings)) {
        throw new AppError(400, 'Lista de configurações é obrigatória');
      }

      const results = [];
      
      for (const setting of settings) {
        try {
          const updated = await systemSettingsService.updateSetting(setting.key, {
            value: String(setting.value),
            description: setting.description
          });
          results.push({ key: setting.key, success: true, data: updated });
        } catch (error) {
          results.push({ key: setting.key, success: false, error: (error as Error).message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: settings.length,
            success: successCount,
            failed: settings.length - successCount
          }
        },
        message: `${successCount} de ${settings.length} configurações atualizadas com sucesso`
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro na atualização em massa:', error);
      throw new AppError(500, 'Erro na atualização em massa de configurações');
    }
  }
}

export const systemSettingsController = new SystemSettingsController(); 