import { Request, Response } from "express";
import { ChatServices } from "../services/chat.services";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs";

export class ChatControllers {
  async create(req: Request, res: Response): Promise<Response> {
    const chatServices = new ChatServices();
    const userId = res.locals.decode.id;
    const data = await chatServices.create(userId, req.body);
    return res.status(201).json(data);
  }

  async findUserChats(req: Request, res: Response): Promise<Response> {
    const chatServices = new ChatServices();
    const userId = res.locals.decode.id;
    const data = await chatServices.findUserChats(userId);
    return res.status(200).json(data);
  }

  async findChatMessages(req: Request, res: Response): Promise<Response> {
    const chatServices = new ChatServices();
    const userId = res.locals.decode.id;
    const chatId = Number(req.params.chatId);
    const data = await chatServices.findChatMessages(chatId, userId);
    return res.status(200).json(data);
  }

  async sendMessage(req: Request, res: Response): Promise<Response> {
    const chatServices = new ChatServices();
    const userId = res.locals.decode.id;
    const data = await chatServices.sendMessage(userId, req.body);
    return res.status(201).json(data);
  }

  async updateChatStatus(req: Request, res: Response): Promise<Response> {
    const chatServices = new ChatServices();
    const userId = res.locals.decode.id;
    const chatId = Number(req.params.chatId);
    await chatServices.updateChatStatus(chatId, userId, req.body);
    return res.status(204).send();
  }

  async markMessagesAsRead(req: Request, res: Response): Promise<Response> {
    const chatServices = new ChatServices();
    const userId = res.locals.decode.id;
    const chatId = Number(req.params.chatId);
    await chatServices.markMessagesAsRead(chatId, userId);
    return res.status(204).send();
  }

  async uploadFile(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.files || !('file' in req.files)) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const chatServices = new ChatServices();
      const userId = res.locals.decode.id;
      const chatId = Number(req.body.chatId);
      const file = (Array.isArray(req.files.file) ? req.files.file[0] : req.files.file) as unknown as UploadedFile;

      // Verifica se o usuário tem acesso ao chat
      const chat = await chatServices.findChatById(chatId);
      if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
        return res.status(403).json({ error: 'Acesso não autorizado a este chat' });
      }

      // Define o diretório de upload
      const uploadDir = path.join(__dirname, '..', '..', 'dist', 'uploads', 'ChatInterno');

      // Garante que o diretório existe
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Gera um nome único para o arquivo
      const fileExtension = path.extname(file.name).toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      try {
        // Move o arquivo para a pasta de uploads
        await file.mv(filePath);
      
        // Verifica se o arquivo foi realmente salvo
        if (!fs.existsSync(filePath)) {
          throw new Error('Arquivo não foi salvo corretamente');
        }

        // Cria a mensagem com o arquivo
        const fileUrl = path.join('ChatInterno', fileName).replace(/\\/g, '/');

        const message = await chatServices.sendMessage(userId, {
          chatId,
          content: `[Arquivo] ${file.name}`,
          fileUrl,
          fileType: file.mimetype,
          fileName: file.name
        });

        return res.status(201).json(message);
      } catch (error) {
        console.error('Erro ao mover arquivo:', error);
        // Se houver erro ao mover o arquivo, tenta removê-lo se existir
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new Error('Erro ao salvar arquivo');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
  }

  async updateMessage(req: Request, res: Response): Promise<Response> {
    try {
      const chatServices = new ChatServices();
      const userId = res.locals.decode.id;
      const messageId = Number(req.params.messageId);

      // Verifica se a mensagem existe e pertence ao usuário
      const message = await chatServices.findMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (message.senderId !== userId) {
        return res.status(403).json({ error: 'Não autorizado a editar esta mensagem' });
      }

      const updatedMessage = await chatServices.updateMessage(messageId, req.body);
      return res.status(200).json(updatedMessage);
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
      return res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<Response> {
    try {
      const chatServices = new ChatServices();
      const userId = res.locals.decode.id;
      const messageId = Number(req.params.messageId);

      // Verifica se a mensagem existe e pertence ao usuário
      const message = await chatServices.findMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (message.senderId !== userId) {
        return res.status(403).json({ error: 'Não autorizado a deletar esta mensagem' });
      }

      await chatServices.deleteMessage(messageId);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      return res.status(500).json({ error: 'Erro ao deletar mensagem' });
    }
  }
} 