import { Router } from 'express';
import { adminController } from '../controllers/admin.controllers';
import { ValidateToken } from '../middlewares/ensureAuthenticated';
import { hasPermission } from '../middlewares/hasPermission';
import { ValidateBody } from '../middlewares/validateBody.middlewares';
import { parseIntParams } from '../middlewares/parseParams';
import { createUserSchema, updateUserSchema, toggleUserStatusSchema } from '../schemas/admin.schema';

const adminRoutes = Router();

// Rotas de debug (sem autenticação para teste)
adminRoutes.get('/debug/users', adminController.debugUsers.bind(adminController));
adminRoutes.get('/test', (req, res) => {
  res.json({ 
    message: 'Admin API funcionando!', 
    timestamp: new Date().toISOString() 
  });
});

// Aplicar middleware de autenticação e autorização nas demais rotas
adminRoutes.use(ValidateToken.execute);
adminRoutes.use(hasPermission('admin_access'));

// Dashboard
adminRoutes.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));
adminRoutes.get('/activity', adminController.getActivityData.bind(adminController));
adminRoutes.get('/users-by-department', adminController.getUsersByDepartment.bind(adminController));

// Users Management
adminRoutes.get('/users', adminController.getAllUsers.bind(adminController));
adminRoutes.post('/users', ValidateBody.execute(createUserSchema), adminController.createUser.bind(adminController));
adminRoutes.put('/users/:userId', parseIntParams(['userId']), ValidateBody.execute(updateUserSchema), adminController.updateUser.bind(adminController));
adminRoutes.delete('/users/:userId', parseIntParams(['userId']), adminController.deleteUser.bind(adminController));
adminRoutes.patch('/users/:userId/status', parseIntParams(['userId']), ValidateBody.execute(toggleUserStatusSchema), adminController.toggleUserStatus.bind(adminController));
adminRoutes.post('/users/:userId/reset-password', parseIntParams(['userId']), adminController.resetUserPassword.bind(adminController));

// Email Configuration Check
adminRoutes.get('/email-config/check', adminController.checkEmailConfig.bind(adminController));

// Export
adminRoutes.get('/export/users', adminController.exportUsers.bind(adminController));

// System
adminRoutes.get('/system/health', adminController.getSystemHealth.bind(adminController));
adminRoutes.get('/logs', adminController.getSystemLogs.bind(adminController));

export { adminRoutes }; 