import { Router } from 'express';
import { ValidateToken } from '../middlewares/ensureAuthenticated';
import { hasImplantacaoAccess } from '../middlewares/hasImplantacaoAccess';
import { hasProjectAccess } from '../middlewares/hasProjectAccess';
import { ProjectControllers } from '../controllers/project.controllers';
import { ProjectTaskControllers } from '../controllers/projectTask.controllers';

const projectRoutes = Router();
const projectControllers = new ProjectControllers();
const projectTaskControllers = new ProjectTaskControllers();

// Middleware de autenticação
projectRoutes.use(ValidateToken.execute);

// ROTA TEMPORÁRIA PARA ATRIBUIR USUÁRIOS ESPECÍFICOS
projectRoutes.post('/assign-specific-users', projectControllers.assignSpecificUsers);

// Rotas que precisam apenas de acesso ao departamento de Implantação
projectRoutes.get('/client/:clientId', hasImplantacaoAccess, projectControllers.findByClient);
projectRoutes.get('/departments', hasImplantacaoAccess, projectTaskControllers.getAllDepartments);
projectRoutes.get('/departments/:department/users', hasImplantacaoAccess, projectTaskControllers.getUsersByDepartment);
projectRoutes.get('/departments/:department/users-complete', hasImplantacaoAccess, projectTaskControllers.getUsersFromDepartment);
projectRoutes.get('/departments/:department/stats', hasImplantacaoAccess, projectTaskControllers.getDepartmentStats);
projectRoutes.get('/departments/:department/tasks', hasImplantacaoAccess, projectTaskControllers.findByDepartment);
projectRoutes.get('/departments/:department/tasks-with-assignments', hasImplantacaoAccess, projectTaskControllers.findByDepartmentWithAssignments);

// Rotas gerais de projetos (lista todos os projetos que o usuário tem acesso)
projectRoutes.get('/', projectControllers.findMany);
projectRoutes.post('/', hasImplantacaoAccess, projectControllers.create);

// ===== ROTAS ESPECÍFICAS DE PROJETOS (com verificação de acesso) =====
// Rotas de atribuições de usuários aos projetos
projectRoutes.post('/:id/assignments', hasImplantacaoAccess, projectControllers.assignUsersToProject);
projectRoutes.delete('/:id/assignments/:userId', hasImplantacaoAccess, projectControllers.removeUserFromProject);
projectRoutes.get('/:id/assignments', hasProjectAccess, projectControllers.getProjectAssignments);
projectRoutes.get('/:id/all-assignments', hasProjectAccess, projectControllers.getAllTaskAssignments);
projectRoutes.get('/:id/access-check', hasProjectAccess, projectControllers.checkProjectAccess);

// Rotas de tarefas de projetos
projectRoutes.get('/:projectId/tasks', hasProjectAccess, projectTaskControllers.findByProject);
projectRoutes.post('/:projectId/tasks', hasProjectAccess, projectTaskControllers.create);
projectRoutes.post('/:projectId/tasks-with-auto-assignments', hasProjectAccess, projectTaskControllers.createWithAutoAssignments);
projectRoutes.get('/tasks/:id', hasProjectAccess, projectTaskControllers.findOne);
projectRoutes.put('/tasks/:id', hasProjectAccess, projectTaskControllers.update);
projectRoutes.delete('/tasks/:id', hasImplantacaoAccess, projectTaskControllers.delete);
projectRoutes.patch('/tasks/:id/status', hasProjectAccess, projectTaskControllers.updateStatus);

// Rotas de atribuição de tarefas (individual)
projectRoutes.patch('/tasks/:id/assign', hasProjectAccess, projectTaskControllers.assignToUser);
projectRoutes.patch('/tasks/:id/unassign', hasProjectAccess, projectTaskControllers.unassignFromUser);

// ===== ROTAS PARA MÚLTIPLAS ATRIBUIÇÕES DE TAREFAS =====
// Rotas de múltiplas atribuições
projectRoutes.post('/tasks/:id/assignments', hasProjectAccess, projectTaskControllers.addMultipleAssignments);
projectRoutes.delete('/tasks/:id/assignments/:userId', hasProjectAccess, projectTaskControllers.removeAssignment);
projectRoutes.get('/tasks/:id/assignments', hasProjectAccess, projectTaskControllers.getTaskAssignments);

// Rotas de auto-atribuições por departamento
projectRoutes.post('/tasks/:id/auto-assignments', hasProjectAccess, projectTaskControllers.setupAutoAssignment);
projectRoutes.post('/tasks/:id/process-auto-assignments', hasProjectAccess, projectTaskControllers.processAutoAssignments);

// Rotas de projetos individuais
projectRoutes.get('/:id', hasProjectAccess, projectControllers.findOne);
projectRoutes.put('/:id', hasImplantacaoAccess, projectControllers.update);
projectRoutes.delete('/:id', hasImplantacaoAccess, projectControllers.delete);

export { projectRoutes }; 