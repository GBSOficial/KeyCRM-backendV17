import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  message: z.string().min(3, "Mensagem deve ter no mínimo 3 caracteres"),
  userId: z.number(),
});

export const updateNotificationSchema = z.object({
  title: z.string().min(3).optional(),
  message: z.string().min(3).optional(),
  read: z.boolean().optional(),
}); 