import { z } from "zod";

const VALID_STATUS = ["A_FAZER", "EM_PROGRESSO", "EM_REVISAO", "CONCLUIDO"] as const;
const VALID_PRIORITIES = ["BAIXA", "MEDIA", "ALTA"] as const;

export type ProjectTaskStatus = typeof VALID_STATUS[number];
export type ProjectTaskPriority = typeof VALID_PRIORITIES[number];

export const projectTaskSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  status: z.enum(VALID_STATUS, {
    errorMap: () => ({ message: "Status inválido" })
  }),
  priority: z.enum(VALID_PRIORITIES, {
    errorMap: () => ({ message: "Prioridade inválida" })
  }),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  projectId: z.number(),
  department: z.string(),
  assignedToId: z.number().optional().nullable(),
  order: z.number().optional().nullable(),
  estimatedDays: z.number().optional().nullable()
});

export const updateProjectTaskSchema = projectTaskSchema.partial();

export type TProjectTask = z.infer<typeof projectTaskSchema>;
export type TProjectTaskUpdate = z.infer<typeof updateProjectTaskSchema>; 