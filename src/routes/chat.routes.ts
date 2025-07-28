import { Router } from "express";
import { ChatControllers } from "../controllers/chat.controllers";
import { ValidateBody } from "../middlewares/validateBody.middlewares";
import { ValidateToken } from "../middlewares/validateToken.middlewares";
import { createChatSchema, createMessageSchema, updateChatSchema } from "../schemas/chat.schema";
import fileUpload from 'express-fileupload';
import { UploadedFile, FileArray } from 'express-fileupload';

const router = Router();
const chatControllers = new ChatControllers();

// Middleware de autenticação para todas as rotas
router.use((req, res, next) => ValidateToken.execute(req, res, next));

// Middleware de upload de arquivos
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  abortOnLimit: true
}));

// Rotas de chat
router.post("/", ValidateBody.execute(createChatSchema), chatControllers.create);
router.get("/", chatControllers.findUserChats);
router.patch("/:chatId/status", ValidateBody.execute(updateChatSchema), chatControllers.updateChatStatus);

// Rotas de mensagens
router.get("/:chatId/messages", chatControllers.findChatMessages);
router.post("/:chatId/messages", ValidateBody.execute(createMessageSchema), chatControllers.sendMessage);
router.put("/:chatId/read", chatControllers.markMessagesAsRead);
router.put("/messages/:messageId", chatControllers.updateMessage);
router.delete("/messages/:messageId", chatControllers.deleteMessage);

// Rota para upload de arquivos
router.post('/upload', chatControllers.uploadFile);

export { router as chatRouter }; 