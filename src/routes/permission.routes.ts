import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controllers';
import { ValidateToken } from '../middlewares/validateToken.middlewares';
import { ensureDirector } from '../middlewares/ensureDirector';
import { hasPermission } from '../middlewares/hasPermission';

const permissionRoutes = Router();
const permissionController = new PermissionController();

// Middleware de autenticação para todas as rotas
permissionRoutes.use(ValidateToken.execute);

// Middleware de autorização - apenas diretores podem gerenciar permissões
permissionRoutes.use(ensureDirector);

// ===== PERMISSÕES =====
permissionRoutes.get('/permissions', permissionController.getAllPermissions.bind(permissionController));
permissionRoutes.post('/permissions', permissionController.createPermission.bind(permissionController));

// ===== ROLES/FUNÇÕES =====
permissionRoutes.get('/roles', permissionController.getAllRoles.bind(permissionController));
permissionRoutes.post('/roles', permissionController.createRole.bind(permissionController));
permissionRoutes.put('/roles/:id', permissionController.updateRole.bind(permissionController));

// ===== ATRIBUIÇÕES DE USUÁRIO =====
permissionRoutes.get('/users/:userId/permissions', permissionController.getUserPermissions.bind(permissionController));
permissionRoutes.post('/users/:userId/roles', permissionController.assignRoleToUser.bind(permissionController));
permissionRoutes.delete('/users/:userId/roles/:roleId', permissionController.removeRoleFromUser.bind(permissionController));

// ===== VERIFICAÇÃO DE PERMISSÕES =====
permissionRoutes.get('/users/:userId/check/:permissionKey', permissionController.checkUserPermission.bind(permissionController));

// ===== INICIALIZAÇÃO E ESTATÍSTICAS =====
permissionRoutes.post('/initialize', permissionController.initializeSystem.bind(permissionController));
permissionRoutes.get('/stats', permissionController.getPermissionStats.bind(permissionController));

// ===== ROTAS DE TESTE =====
const testRoutes = Router();

// Rota sem autenticação
testRoutes.get('/test', (req, res) => {
  res.json({ message: 'Sistema de permissões funcionando!', timestamp: new Date() });
});

// Rota com autenticação para testar permissões
testRoutes.get('/test-auth', ValidateToken.execute, (req: any, res) => {
  res.json({ 
    message: 'Usuário autenticado!', 
    user: {
      id: req.user?.id,
      name: req.user?.name,
      roles: req.user?.roles,
      permissions: req.user?.permissions
    },
    timestamp: new Date() 
  });
});

// Rota protegida por permissão específica
testRoutes.get('/test-permission', ValidateToken.execute, hasPermission('admin_access'), (req, res) => {
  res.json({ 
    message: 'Acesso liberado! Você tem a permissão admin_access', 
    timestamp: new Date() 
  });
});

export { permissionRoutes, testRoutes }; 