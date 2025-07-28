import { Router } from 'express';
import { ValidateToken } from '../middlewares/ensureAuthenticated';
import { hasImplantacaoAccess } from '../middlewares/hasImplantacaoAccess';
import { index, show, create, update, deleteClient, projects } from '../controllers/ClientController';

const clientRoutes = Router();

// Middleware de autenticação para todas as rotas
clientRoutes.use(ValidateToken.execute);

// Rotas de visualização - acessíveis para todos os usuários autenticados
clientRoutes.get('/', index);
clientRoutes.get('/:id', show);
clientRoutes.get('/:id/projects', projects);

// Rotas de modificação - apenas para departamento de Implantação
clientRoutes.post('/', hasImplantacaoAccess, create);
clientRoutes.put('/:id', hasImplantacaoAccess, update);
clientRoutes.delete('/:id', hasImplantacaoAccess, deleteClient);

export { clientRoutes }; 