import { Router } from 'express';
import { systemSettingsController } from '../controllers/systemSettings.controllers';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { hasPermission } from '../middlewares/hasPermission';

const systemSettingsRoutes = Router();

// Rota pública para configurações básicas (sem auth)
systemSettingsRoutes.get('/public', systemSettingsController.getPublicSettings);

// Rota pública para verificar status de manutenção
systemSettingsRoutes.get('/maintenance/status', systemSettingsController.getMaintenanceStatus);

// Todas as outras rotas requerem autenticação e permissão de admin
systemSettingsRoutes.use(ensureAuthenticated);
systemSettingsRoutes.use(hasPermission('admin_access'));

// Rotas principais
systemSettingsRoutes.get('/', systemSettingsController.getAllSettings);
systemSettingsRoutes.post('/', systemSettingsController.createSetting);
systemSettingsRoutes.put('/bulk', systemSettingsController.bulkUpdateSettings);
systemSettingsRoutes.post('/reset', systemSettingsController.resetToDefaults);

// Rotas por categoria
systemSettingsRoutes.get('/category/:category', systemSettingsController.getSettingsByCategory);
systemSettingsRoutes.put('/category/:category', systemSettingsController.updateCategorySettings);

// Rotas específicas
systemSettingsRoutes.get('/security', systemSettingsController.getSecuritySettings);
systemSettingsRoutes.get('/email', systemSettingsController.getEmailSettings);
systemSettingsRoutes.post('/test-email', systemSettingsController.testEmailSettings);

// Rotas para configuração individual
systemSettingsRoutes.get('/:key', systemSettingsController.getSetting);
systemSettingsRoutes.put('/:key', systemSettingsController.updateSetting);
systemSettingsRoutes.delete('/:key', systemSettingsController.deleteSetting);

export { systemSettingsRoutes }; 