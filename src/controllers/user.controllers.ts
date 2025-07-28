import { Request, Response } from "express";
import { UserServices } from "../services/user.services";
import path from "path";
import fs from "fs";

export class UserControllers {
  async register(req: Request, res: Response) {
    const userServices = new UserServices();
    const data = await userServices.register(req.body);
    return res.status(201).json(data);
  }

  async login(req: Request, res: Response) {
    const userServices = new UserServices();
    const data = await userServices.login(req.body);
    return res.status(200).json(data);
  }

  async findMany(req: Request, res: Response) {
    const userServices = new UserServices();
    const data = await userServices.findMany();
    return res.status(200).json(data);
  }

  async getUser(req: Request, res: Response) {
    const userServices = new UserServices();
    const id = res.locals.decode.id;
    const data = await userServices.getUser(id);
    return res.status(200).json(data);
  }

  async update(req: Request, res: Response) {
    const userServices = new UserServices();
    const data = await userServices.update(parseInt(req.params.id), req.body);
    return res.status(200).json(data);
  }

  async delete(req: Request, res: Response) {
    const userServices = new UserServices();
    await userServices.delete(parseInt(req.params.id));
    return res.status(204).json();
  }

  async findByChatCode(req: Request, res: Response) {
    try {
      const userServices = new UserServices();
      const { chatCode } = req.params;
      // Decodifica o parâmetro da URL
      const decodedChatCode = decodeURIComponent(chatCode);
      
      const user = await userServices.findByChatCode(decodedChatCode);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado com este código" });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário por código de chat:', error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async generateChatCode(req: Request, res: Response) {
    try {
      const userServices = new UserServices();
      const userId = res.locals.decode.id;
      const chatCode = await userServices.generateChatCodeForUser(userId);
      const remainingGenerations = await userServices.getRemainingCodeGenerations(userId);
      return res.status(200).json({ 
        chatCode, 
        remainingGenerations 
      });
    } catch (error: any) {
      console.error('Erro ao gerar código de chat:', error);
      return res.status(error.statusCode || 500).json({ 
        error: error.message || "Erro interno do servidor" 
      });
    }
  }

  async getRemainingCodeGenerations(req: Request, res: Response) {
    try {
      const userServices = new UserServices();
      const userId = res.locals.decode.id;
      const remainingGenerations = await userServices.getRemainingCodeGenerations(userId);
      return res.status(200).json({ remainingGenerations });
    } catch (error: any) {
      console.error('Erro ao verificar gerações restantes:', error);
      return res.status(error.statusCode || 500).json({ 
        error: error.message || "Erro interno do servidor" 
      });
    }
  }

  async uploadProfileImage(req: Request, res: Response) {
    try {
      const userServices = new UserServices();
      const userId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      // Salva o caminho relativo da imagem
      const imgPath = `Profile/${req.file.filename}`;

      const user = await userServices.update(userId, { img: imgPath });
      
      // Constrói a URL completa
      const imageUrl = `/uploads/${imgPath}`;
      
      // Verifica se o arquivo está acessível
      const absolutePath = path.resolve(process.cwd(), 'dist/uploads', imgPath);

      return res.status(200).json({ 
        img: imgPath, 
        user,
        imageUrl,
        debug: {
          originalPath: req.file.path,
          savedPath: absolutePath,
          exists: fs.existsSync(absolutePath)
        }
      });
    } catch (error) {
      console.error('Erro no upload de imagem:', error);
      return res.status(500).json({ error: "Erro ao fazer upload da imagem." });
    }
  }

  // Método de debug público para verificar usuários
  async debugUsers(req: Request, res: Response) {
    try {
      const userServices = new UserServices();
      const users = await userServices.findMany();
      
      return res.status(200).json({
        total: users.length,
        users: users.slice(0, 5).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          offices: u.offices,
          department: u.department
        })),
        message: 'Debug: Usuários encontrados no banco'
      });
    } catch (error) {
      console.error('Erro ao buscar usuários para debug:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  }
}
