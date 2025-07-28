import { Request, Response } from "express";
import { ApiTokenServices } from "../services/apiToken.services";

interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export class ApiTokenControllers {
  async create(req: Request, res: Response) {
    try {
      const apiTokenServices = new ApiTokenServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { name, expiresIn } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const apiToken = await apiTokenServices.create({
        name,
        expiresIn: expiresIn || "30d",
        userId
      });

      return res.status(201).json(apiToken);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao criar token de API' });
    }
  }

  async findMany(req: Request, res: Response) {
    try {
      const apiTokenServices = new ApiTokenServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const apiTokens = await apiTokenServices.findMany();
      return res.json(apiTokens);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao listar tokens de API' });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const apiTokenServices = new ApiTokenServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const tokenId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'ID do token inválido' });
      }

      const apiToken = await apiTokenServices.findOne(tokenId);
      return res.json(apiToken);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao buscar token de API' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const apiTokenServices = new ApiTokenServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const tokenId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const apiToken = await apiTokenServices.update(tokenId, req.body);
      return res.json(apiToken);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao atualizar token de API' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const apiTokenServices = new ApiTokenServices();
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const tokenId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const result = await apiTokenServices.delete(tokenId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao excluir token de API' });
    }
  }
}
