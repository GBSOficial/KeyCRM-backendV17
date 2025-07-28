import { number } from "zod";
import { prisma } from "../database/prisma";
import { AppError } from "../errors/appError";
import {
  TUser,
  TUserLoginReturn,
  TUserLoginbody,
  TUserRegisterBody,
  TUserReturn,
  TUserUpdate,
  userReturnSchema,
} from "../schemas/user.schemas";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateUniqueChatCode } from "../utils/chatCodeGenerator";

export class UserServices {
  async register(body: TUserRegisterBody): Promise<TUserReturn> {
    try {
      const hashPassowrd = await bcrypt.hash(body.password, 10);
      
      // Gera código único para chat
      const chatCode = await generateUniqueChatCode(body.name, prisma);
      
      const newUser = {
        ...body,
        password: hashPassowrd,
        chatCode,
      };

      const user = await prisma.user.create({ data: newUser });

      return userReturnSchema.parse(user);
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw new AppError(500, "Erro ao registrar usuário");
    }
  }

  async login(body: TUserLoginbody): Promise<TUserLoginReturn> {
    try {
      const user = await prisma.user.findFirst({ where: { email: body.email } });

      if (!user) {
        throw new AppError(404, "User not registered");
      }

      // Verificar se o usuário está ativo
      if (user.status === 'INACTIVE') {
        throw new AppError(403, "User account is inactive. Contact administrator.");
      }

      if (user.status === 'SUSPENDED') {
        throw new AppError(403, "User account is suspended. Contact administrator.");
      }

      const compare = await bcrypt.compare(body.password, user.password);

      if (!compare) {
        throw new AppError(403, "Email and password doesn't match");
      }

      // Atualizar lastLogin
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Carregar permissões do usuário
      let userPermissions: string[] = [];
      let userRoles: string[] = [];
      
      try {
        const { PermissionService } = await import('./permission.services');
        const permissionService = new PermissionService();
        const userPermsData = await permissionService.getUserPermissions(user.id);
        
        userPermissions = userPermsData.permissions.map(p => p.key);
        userRoles = userPermsData.roles.map(r => r.name);
        
        console.log(`🔑 Login: Usuário ${user.email} carregado com ${userPermissions.length} permissões`);
      } catch (error) {
        console.log('Sistema de permissões não disponível ainda, usando sistema antigo');
      }

      // Criar log de login (tentativa)
      try {
        const { SystemLogService } = await import('./systemLog.services');
        await SystemLogService.logUserLogin(user.id);
      } catch (error) {
        // Ignorar erro de log se a tabela não existir ainda
        console.log('Sistema de logs não disponível ainda');
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          offices: user.offices,
          email: user.email
        }, 
        process.env.JWT_SECRET as string
      );

      // Incluir permissões no retorno do usuário
      const userWithPermissions = {
        ...userReturnSchema.parse(updatedUser),
        permissions: userPermissions,
        roles: userRoles
      };

      return { accessToken: token, user: userWithPermissions };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao fazer login:', error);
      throw new AppError(500, "Erro ao fazer login");
    }
  }

  async findMany(): Promise<TUser[]> {
    try {
      const data = await prisma.user.findMany();
      const dataFixed = data.map(u => ({
        ...u,
        img: u.img ?? undefined
      }));
      return dataFixed;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw new AppError(500, "Erro ao listar usuários");
    }
  }

  async getUser(id: number): Promise<TUserReturn> {
    try {
      const user = await prisma.user.findFirst({ where: { id } });
      
      if (!user) {
        throw new AppError(404, "Usuário não encontrado");
      }

      const userFixed = { ...user, img: user.img ?? undefined };
      return userReturnSchema.parse(userFixed);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao buscar usuário:', error);
      throw new AppError(500, "Erro ao buscar usuário");
    }
  }

  async update(id: number, body: TUserUpdate & { img?: string }){
    try {
      const user = await prisma.user.findFirst({ where: { id } });

      if (!user) {
        throw new AppError(404, "User not found");
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...body,
          password: body.password? await bcrypt.hash(body.password, 10) : user.password,
        },
      });

      const updatedUserFixed = { ...updatedUser, img: updatedUser.img ?? undefined };
      return userReturnSchema.parse(updatedUserFixed);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao atualizar usuário:', error);
      throw new AppError(500, "Erro ao atualizar usuário");
    }
  }
  
  async delete(id: number): Promise<void>{
    try {
      const user = await prisma.user.findFirst({ where: { id } });

      if (!user) {
        throw new AppError(404, "User not found");
      }
      await prisma.user.delete({ where: { id: id}})
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao deletar usuário:', error);
      throw new AppError(500, "Erro ao deletar usuário");
    }
  }

  /**
   * Busca usuário por código de chat
   */
  async findByChatCode(chatCode: string): Promise<TUserReturn | null> {
    try {
      const user = await prisma.user.findFirst({ 
        where: { 
          chatCode: chatCode.toUpperCase(),
          status: "ACTIVE"
        }
      });

      if (!user) {
        return null;
      }

      const userFixed = { ...user, img: user.img ?? undefined };
      return userReturnSchema.parse(userFixed);
    } catch (error) {
      console.error('Erro ao buscar usuário por código de chat:', error);
      throw new AppError(500, "Erro ao buscar usuário por código de chat");
    }
  }

  /**
   * Gera um novo código de chat para um usuário existente
   */
  async generateChatCodeForUser(userId: number): Promise<string> {
    try {
      const user = await prisma.user.findFirst({ where: { id: userId } });

      if (!user) {
        throw new AppError(404, "Usuário não encontrado");
      }

      // Verifica se o usuário já atingiu o limite de 3 gerações
      if (user.chatCodeGenerations >= 3) {
        throw new AppError(403, "Limite de gerações de código atingido. Máximo de 3 gerações permitidas.");
      }

      const chatCode = await generateUniqueChatCode(user.name, prisma);
      
      await prisma.user.update({
        where: { id: userId },
        data: { 
          chatCode,
          chatCodeGenerations: user.chatCodeGenerations + 1
        }
      });

      return chatCode;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao gerar código de chat:', error);
      throw new AppError(500, "Erro ao gerar código de chat");
    }
  }

  /**
   * Verifica quantas gerações de código restam para o usuário
   */
  async getRemainingCodeGenerations(userId: number): Promise<number> {
    try {
      const user = await prisma.user.findFirst({ 
        where: { id: userId },
        select: { chatCodeGenerations: true }
      });

      if (!user) {
        throw new AppError(404, "Usuário não encontrado");
      }

      return Math.max(0, 3 - user.chatCodeGenerations);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erro ao verificar gerações restantes:', error);
      throw new AppError(500, "Erro ao verificar gerações restantes");
    }
  }
}
