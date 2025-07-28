import { Router } from 'express';
import { TaskControllers } from '../controllers/task.controllers';
import { ValidateToken } from '../middlewares/validateToken.middlewares';
import { ValidateBody } from '../middlewares/validateBody.middlewares';
import { taskSchema, updateTaskSchema } from '../schemas/task.schema';
import { hasAnyPermission } from '../middlewares/hasPermission';

const router = Router();
const taskControllers = new TaskControllers();

// Criar uma nova tarefa
router.post(
  '/',
  ValidateToken.execute,
  hasAnyPermission(['tasks_create', 'admin_access']),
  ValidateBody.execute(taskSchema),
  taskControllers.create
);

// Listar todas as tarefas
router.get(
  '/',
  ValidateToken.execute,
  hasAnyPermission(['tasks_view_own', 'tasks_view_all', 'admin_access']),
  taskControllers.findMany
);

// Listar tarefas por lead (deve vir antes da rota com :id)
router.get(
  '/lead/:leadId',
  ValidateToken.execute,
  hasAnyPermission(['tasks_view_own', 'tasks_view_all', 'admin_access']),
  taskControllers.findByLead
);

// Buscar uma tarefa específica
router.get(
  '/:id',
  ValidateToken.execute,
  hasAnyPermission(['tasks_view_own', 'tasks_view_all', 'admin_access']),
  taskControllers.findOne
);

// Atualizar uma tarefa
router.put(
  '/:id',
  ValidateToken.execute,
  hasAnyPermission(['tasks_edit', 'admin_access']),
  ValidateBody.execute(updateTaskSchema),
  taskControllers.update
);

// Excluir uma tarefa
router.delete(
  '/:id',
  ValidateToken.execute,
  hasAnyPermission(['tasks_delete', 'admin_access']),
  taskControllers.delete
);

export { router as taskRouter }; 