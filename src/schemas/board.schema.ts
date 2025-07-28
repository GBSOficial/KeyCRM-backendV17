import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().min(3, "Nome do board deve ter no mínimo 3 caracteres"),
});

export const updateBoardSchema = createBoardSchema.partial(); 