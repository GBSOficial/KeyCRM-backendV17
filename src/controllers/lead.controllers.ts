import { Request, Response } from "express";
import { leadServices } from "../services/lead.services";
import { AppError } from "../errors/appError";

interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  offices?: string;
  department?: string | null;
  permissions?: string[];
  roles?: string[];
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export class LeadControllers {
  async create(req: Request, res: Response): Promise<Response> {
    const userId = req.body.userId || res.locals.decode.id;

    const data = await leadServices.create(req.body, userId);

    return res.status(201).json(data);
  }

  async findMany(req: Request, res: Response): Promise<Response> {
    const userId = req.user?.id || res.locals.decode?.id;
    const userPermissions = (req.user as any)?.permissions || [];
    const userDepartment = (req.user as any)?.department || res.locals.decode?.department;
    const showAllLeads = req.query.showAll === 'true';
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    // Extrair filtros da query
    const { showAll, page: _, limit: __, ...filters } = req.query;

    // Debug: Log do controller
    console.log('🔍 Controller - Dados completos:', {
      userId,
      userDepartment,
      userPermissions,
      showAllLeads,
      filters,
      assignedByFilter: filters.assignedBy,
      queryParams: req.query
    });

    const data = await leadServices.findMany(
      userId, 
      userPermissions, 
      showAllLeads,
      page,
      limit,
      filters,
      userDepartment
    );

    return res.status(200).json(data);
  }

  async findOne(req: Request, res: Response): Promise<Response> {
    const userId = res.locals.decode.id;

    const data = await leadServices.findOne(Number(req.params.id), userId);

    return res.status(200).json(data);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const userId = res.locals.decode.id;

    const data = await leadServices.update(
      Number(req.params.id),
      req.body,
      userId
    );

    return res.status(200).json(data);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const userId = res.locals.decode.id;

    await leadServices.delete(Number(req.params.id), userId);

    return res.status(204).json();
  }

  async approveConversion(req: Request, res: Response): Promise<Response> {
    try {
      const userId = res.locals.decode.id;

      const data = await leadServices.approveConversion(Number(req.params.id), userId);

      return res.status(200).json({
        message: "Lead aprovado para conversão com sucesso",
        data
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao aprovar conversão:', error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async rejectConversion(req: Request, res: Response): Promise<Response> {
    try {
      const userId = res.locals.decode.id;
      const { reason } = req.body;

      const data = await leadServices.rejectConversion(Number(req.params.id), userId, reason);

      return res.status(200).json({
        message: "Conversão rejeitada com sucesso",
        data
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao rejeitar conversão:', error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getApprovedForConversion(req: Request, res: Response): Promise<Response> {
    try {
      const data = await leadServices.getApprovedForConversion();

      return res.status(200).json({
        message: "Leads aprovados para conversão",
        data
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao buscar leads aprovados:', error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async markAsConverted(req: Request, res: Response): Promise<Response> {
    try {
      const data = await leadServices.markAsConverted(Number(req.params.id));

      return res.status(200).json({
        message: "Lead marcado como convertido com sucesso",
        data
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao marcar lead como convertido:', error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
} 