import { z } from "zod";

// Schema para criação de chat
export const createChatSchema = z.object({
  user2Id: z.number().positive("ID do usuário destinatário é obrigatório"),
});

// Schema para criação de mensagem
export const createMessageSchema = z.object({
  content: z.string().min(1, "Mensagem não pode estar vazia"),
  chatId: z.number().positive("ID do chat é obrigatório"),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  fileName: z.string().optional(),
  forwarded: z.boolean().optional(),
});

// Schema para atualização de status do chat
export const updateChatSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED", "CLOSED"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

// Tipos inferidos dos schemas
export type TCreateChat = z.infer<typeof createChatSchema>;
export type TCreateMessage = z.infer<typeof createMessageSchema>;
export type TUpdateChat = z.infer<typeof updateChatSchema>; 