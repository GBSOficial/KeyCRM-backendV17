import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";
import { TCreateChat, TCreateMessage, TUpdateChat } from "../schemas/chat.schema";
import { NotificationServices } from "./notification.services";
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export class ChatServices {
  async create(userId: number, data: TCreateChat) {
    try {
      // Verifica se já existe um chat entre os usuários
      const existingChat = await prisma.chat.findFirst({
        where: {
          OR: [
            { AND: [{ user1Id: userId }, { user2Id: data.user2Id }] },
            { AND: [{ user1Id: data.user2Id }, { user2Id: userId }] }
          ],
          status: "ACTIVE"
        }
      });

      if (existingChat) {
        return existingChat;
      }

      const chat = await prisma.chat.create({
        data: {
          user1Id: userId,
          user2Id: data.user2Id,
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          }
        }
      });

      // Notifica o usuário que foi adicionado ao chat
      const notificationServices = new NotificationServices();
      await notificationServices.create({
        title: "Novo Chat",
        message: `${chat.user1.name} iniciou uma conversa com você`,
        userId: data.user2Id
      });

      return chat;
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      throw new AppError(500, "Erro ao criar chat");
    }
  }

  async findChatById(chatId: number) {
    try {
      return await prisma.chat.findUnique({
        where: { id: chatId }
      });
    } catch (error) {
      console.error('Erro ao buscar chat:', error);
      throw new AppError(500, "Erro ao buscar chat");
    }
  }

  async findUserChats(userId: number) {
    try {
      return prisma.chat.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: "ACTIVE"
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              email: true,
              img: true
            }
          },
          Message: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        },
        orderBy: {
          updatedAt: "desc"
        }
      });
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      throw new AppError(500, "Erro ao buscar chats");
    }
  }

  async findChatMessages(chatId: number, userId: number) {
    try {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!chat) {
        throw new AppError(404, "Chat não encontrado");
      }

      return prisma.message.findMany({
        where: {
          chatId
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              img: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao buscar mensagens");
    }
  }

  async sendMessage(userId: number, data: TCreateMessage) {
    try {
      const chat = await prisma.chat.findFirst({
        where: {
          id: data.chatId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        include: {
          user1: true,
          user2: true
        }
      });

      if (!chat) {
        throw new AppError(404, "Chat não encontrado");
      }

      // Se for uma mensagem com arquivo, verifica se o arquivo existe
      if (data.fileUrl) {
        const filePath = path.join(__dirname, '..', '..', 'dist', 'uploads', data.fileUrl);
        const uploadDir = path.join(__dirname, '..', '..', 'dist', 'uploads');

        if (!fs.existsSync(filePath)) {
          console.error('Arquivo não encontrado:', {
            fileUrl: data.fileUrl,
            filePath,
            exists: fs.existsSync(filePath),
            __dirname,
            uploadDir,
            fullPath: path.resolve(filePath),
            relativePath: path.relative(path.join(__dirname, '..', '..'), filePath),
            parentDir: path.dirname(filePath),
            parentDirExists: fs.existsSync(path.dirname(filePath)),
            parentDirContents: fs.existsSync(path.dirname(filePath)) ? fs.readdirSync(path.dirname(filePath)) : []
          });
          throw new AppError(404, "Arquivo não encontrado");
        }
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          chatId: data.chatId,
          senderId: userId,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileName: data.fileName,
          forwarded: data.forwarded || false
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              img: true
            }
          }
        }
      });

      // Atualiza a data de atualização do chat
      await prisma.chat.update({
        where: { id: data.chatId },
        data: { updatedAt: new Date() }
      });

      // Notifica o outro usuário
      const notificationServices = new NotificationServices();
      const otherUser = chat.user1Id === userId ? chat.user2 : chat.user1;

      await notificationServices.create({
        userId: otherUser.id,
        title: 'Nova mensagem',
        message: data.fileUrl ? `${chat.user1Id === userId ? chat.user1.name : chat.user2.name} enviou um arquivo` : data.content
      });

      return message;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async updateChatStatus(chatId: number, userId: number, data: TUpdateChat) {
    try {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!chat) {
        throw new AppError(404, "Chat não encontrado");
      }

      return prisma.chat.update({
        where: { id: chatId },
        data: { status: data.status }
      });
    } catch (error) {
      console.error('Erro ao atualizar status do chat:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao atualizar status do chat");
    }
  }

  async markMessagesAsRead(chatId: number, userId: number) {
    try {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!chat) {
        throw new AppError(404, "Chat não encontrado");
      }

      return prisma.message.updateMany({
        where: {
          chatId,
          NOT: {
            senderId: userId
          },
          read: false
        },
        data: {
          read: true
        }
      });
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Erro ao marcar mensagens como lidas");
    }
  }

  async findMessageById(messageId: number) {
    try {
      return await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              img: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar mensagem:', error);
      throw new AppError(500, "Erro ao buscar mensagem");
    }
  }

  async updateMessage(messageId: number, data: { content: string }) {
    try {
      return await prisma.message.update({
        where: { id: messageId },
        data: {
          content: data.content,
          edited: true
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              img: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
      throw new AppError(500, "Erro ao atualizar mensagem");
    }
  }

  async deleteMessage(messageId: number) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (message?.fileUrl) {
        const filePath = path.join(__dirname, '..', '..', 'dist', 'uploads', message.fileUrl);
        const uploadDir = path.join(__dirname, '..', '..', 'dist', 'uploads');

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Em vez de deletar, vamos atualizar a mensagem
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: "Esta mensagem foi apagada",
          fileUrl: null,
          fileType: null,
          fileName: null,
          deleted: true
        }
      });
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      throw new AppError(500, "Erro ao deletar mensagem");
    }
  }
} 