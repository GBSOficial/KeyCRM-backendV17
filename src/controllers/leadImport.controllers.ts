import { Response, Request } from "express";
import { LeadImportServices } from "../services/leadImport.services";
import { leadImportRequestSchema } from "../schemas/leadImport.schema";
import { AppError } from "../errors/appError";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  user?: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export class LeadImportControllers {
  async simulateFile(req: Request, res: Response) {
    try {
      const multerReq = req as MulterRequest;
      
      if (!multerReq.file) {
        throw new AppError(400, "Nenhum arquivo foi enviado");
      }

      const userId = multerReq.user?.id || (res.locals.decode?.id as number);
      const leadImportServices = new LeadImportServices();
      
      // Processar o arquivo e converter para o formato esperado
      const importData = await leadImportServices.processFile(multerReq.file, userId, req.body.fallback);
      
      // Simular a importação com os dados processados
      const result = await leadImportServices.simulate(importData, userId);
      
      return res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Dados inválidos para importação",
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        message: error.message || "Erro ao simular importação de leads",
        error: error.message
      });
    }
  }

  async importFile(req: Request, res: Response) {
    try {
      const multerReq = req as MulterRequest;
      
      if (!multerReq.file) {
        throw new AppError(400, "Nenhum arquivo foi enviado");
      }

      const userId = multerReq.user?.id || (res.locals.decode?.id as number);
      const leadImportServices = new LeadImportServices();
      
      // Processar o arquivo e converter para o formato esperado
      const importData = await leadImportServices.processFile(multerReq.file, userId, req.body.fallback);
      
      // Realizar a importação com os dados processados
      const result = await leadImportServices.import(importData, userId);
      
      return res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Dados inválidos para importação",
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        message: error.message || "Erro ao importar leads",
        error: error.message
      });
    }
  }

  async simulate(req: Request, res: Response) {
    try {
      const authReq = req as MulterRequest;
      const userId = authReq.user?.id || (res.locals.decode?.id as number);
      
      // Validar dados da requisição
      const validatedData = leadImportRequestSchema.safeParse({
        leads: req.body.leads,
        fallback: req.body.fallback || {}
      });

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Dados inválidos para importação",
          errors: validatedData.error.errors
        });
      }
      
      const leadImportServices = new LeadImportServices();
      const result = await leadImportServices.simulate(validatedData.data, userId);
      
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: "Erro ao simular importação de leads",
        error: error.message
      });
    }
  }

  async import(req: Request, res: Response) {
    try {
      const authReq = req as MulterRequest;
      const userId = authReq.user?.id || (res.locals.decode?.id as number);
      
      // Validar dados da requisição
      const validatedData = leadImportRequestSchema.safeParse({
        leads: req.body.leads,
        fallback: req.body.fallback || {}
      });

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Dados inválidos para importação",
          errors: validatedData.error.errors
        });
      }
      
      const leadImportServices = new LeadImportServices();
      const result = await leadImportServices.import(validatedData.data, userId);
      
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: "Erro ao importar leads",
        error: error.message
      });
    }
  }
} 