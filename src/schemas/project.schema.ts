import { z } from "zod";

const VALID_STATUS = ["A_FAZER", "EM_PROGRESSO", "EM_REVISAO", "CONCLUIDO"] as const;
const VALID_PRIORITIES = ["BAIXA", "MEDIA", "ALTA"] as const;

export const createProjectSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  status: z.enum(VALID_STATUS, {
    errorMap: () => ({ message: "Status inválido" })
  }).default("A_FAZER"),
  priority: z.enum(VALID_PRIORITIES, {
    errorMap: () => ({ message: "Prioridade inválida" })
  }).default("MEDIA"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  clientId: z.number().positive("Cliente é obrigatório")
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  clientId: z.number().positive("Cliente é obrigatório").optional()
});

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>; 