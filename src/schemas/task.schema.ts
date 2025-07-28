import { z } from "zod";

const VALID_STATUS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
const VALID_PRIORITIES = ["BAIXA", "MEDIA", "ALTA"] as const;

export const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  description: z.string().optional().nullable(),
  status: z.enum(VALID_STATUS, {
    errorMap: () => ({ message: "Status inválido" })
  }),
  priority: z.enum(VALID_PRIORITIES, {
    errorMap: () => ({ message: "Prioridade inválida" })
  }),
  dueDate: z.union([z.string(), z.date()]).optional().nullable(),
  leadId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  assignedToId: z.number(),
  createdById: z.number().optional()
});

export const updateTaskSchema = taskSchema.partial();

export type TTask = z.infer<typeof taskSchema>;
export type TTaskUpdate = z.infer<typeof updateTaskSchema>; 