import { Router } from 'express';
import { clientRoutes } from './routes/client.routes';
import { projectRoutes } from './routes/project.routes';
import { adminRoutes } from './routes/admin.routes';
import { userRouter } from './routes/user.routes';
import { permissionRoutes, testRoutes } from './routes/permission.routes';
import { systemSettingsRoutes } from './routes/systemSettings.routes';

const routes = Router();

// Health check endpoint
routes.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'KeyCRM API is running'
  });
});

// Rotas de clientes (usando as rotas modularizadas)
routes.use('/v1/clients', clientRoutes);

// Rotas de projetos
routes.use('/v1/projects', projectRoutes);

// Rotas de usuários
routes.use('/v1/users', userRouter);

// Rotas de administração
routes.use('/v1/admin', adminRoutes);

// Rotas de permissões
routes.use('/v1/permissions', permissionRoutes);
routes.use('/v1/test', testRoutes);

// Rotas de configurações do sistema
routes.use('/v1/settings', systemSettingsRoutes);

export { routes }; 