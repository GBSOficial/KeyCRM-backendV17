import { Request, Response } from "express";
import { LeadRoutingRuleServices } from "../services/leadRoutingRule.services";

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

const leadRoutingRuleServices = new LeadRoutingRuleServices();

export class LeadRoutingRuleControllers {
  async create(req: Request, res: Response) {
    try {
      const { pageId, formId, destination, description } = req.body;
      const createdById = req.user?.id;
      
      if (!createdById) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const rule = await leadRoutingRuleServices.create({ pageId, formId, destination, description, createdById });
      return res.status(201).json(rule);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const rules = await leadRoutingRuleServices.findAll();
      return res.json(rules);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rule = await leadRoutingRuleServices.findById(Number(id));
      if (!rule) return res.status(404).json({ error: "Regra não encontrada" });
      return res.json(rule);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const rule = await leadRoutingRuleServices.update(Number(id), data);
      return res.json(rule);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await leadRoutingRuleServices.delete(Number(id));
      return res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(400).json({ error: errorMessage });
    }
  }
} 