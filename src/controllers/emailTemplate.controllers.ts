import { Request, Response } from "express";
import { EmailTemplateServices } from "../services/emailTemplate.services";

// Extensão do tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        offices?: string;
        department?: string | null;
      };
    }
  }
}

const emailTemplateServices = new EmailTemplateServices();

export class EmailTemplateControllers {
  async create(req: Request, res: Response) {
    try {
      const { name, subject, content, category } = req.body;
      const createdById = req.user?.id;
      
      if (!createdById) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const template = await emailTemplateServices.create({
        name,
        subject,
        content,
        category,
        createdById
      });
      
      return res.status(201).json(template);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { category, isActive, showAll } = req.query;
      const userId = req.user?.id;
      const userOffices = req.user?.offices;
      const showAllTemplates = showAll === 'true';
      
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const templates = await emailTemplateServices.findAll(
        filters, 
        userId, 
        userOffices, 
        showAllTemplates
      );
      return res.json(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await emailTemplateServices.findById(Number(id));
      
      if (!template) {
        return res.status(404).json({ error: "Template não encontrado" });
      }
      
      return res.json(template);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const template = await emailTemplateServices.update(Number(id), data);
      return res.json(template);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await emailTemplateServices.delete(Number(id));
      return res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await emailTemplateServices.getCategories();
      return res.json(categories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }
} 