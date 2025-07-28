import { Request, Response } from "express";
import { EmailConfigServices } from "../services/emailConfig.services";

const emailConfigServices = new EmailConfigServices();

export class EmailConfigControllers {
  async create(req: Request, res: Response) {
    try {
      const { 
        name, 
        host, 
        port, 
        secure, 
        username, 
        password, 
        fromName, 
        fromEmail, 
        isDefault 
      } = req.body;
      const createdById = req.user?.id;
      
      if (!createdById) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const config = await emailConfigServices.create({
        name,
        host,
        port: Number(port),
        secure: Boolean(secure),
        username,
        password,
        fromName,
        fromEmail,
        isDefault: Boolean(isDefault),
        createdById
      });
      
      return res.status(201).json(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { isActive, showAll } = req.query;
      const userId = req.user?.id;
      const userOffices = req.user?.offices;
      const showAllConfigs = showAll === 'true';
      
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const configs = await emailConfigServices.findAll(
        filters, 
        userId, 
        userOffices, 
        showAllConfigs
      );
      return res.json(configs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const config = await emailConfigServices.findById(Number(id));
      
      if (!config) {
        return res.status(404).json({ error: "Configuração não encontrada" });
      }
      
      return res.json(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      if (data.port) data.port = Number(data.port);
      if (data.secure !== undefined) data.secure = Boolean(data.secure);
      if (data.isDefault !== undefined) data.isDefault = Boolean(data.isDefault);
      if (data.isActive !== undefined) data.isActive = Boolean(data.isActive);
      
      const config = await emailConfigServices.update(Number(id), data);
      return res.json(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await emailConfigServices.delete(Number(id));
      return res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async testConnection(req: Request, res: Response) {
    try {
      const { host, port, secure, username, password, fromEmail } = req.body;
      
      const result = await emailConfigServices.testConnection({
        host,
        port: Number(port),
        secure: Boolean(secure),
        username,
        password,
        fromEmail
      });
      
      return res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }
} 