import { z } from "zod";

export const createListSchema = z.object({
  name: z.string().min(2, "Nome da lista deve ter no mínimo 2 caracteres"),
  order: z.number(),
  boardId: z.number(),
});

export const updateListSchema = createListSchema.partial(); 