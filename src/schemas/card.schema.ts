import { z } from "zod";

export const createCardSchema = z.object({
  title: z.string().min(2, "Título do card deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  order: z.number(),
  listId: z.number(),
});

export const updateCardSchema = createCardSchema.partial(); 