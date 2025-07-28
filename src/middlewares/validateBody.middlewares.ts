import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../errors/appError";

export class ValidateBody {
  static execute(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
      return next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return res.status(422).json({ 
            message: "Erro de validação",
            errors 
          });
        }
        return next(new AppError(500, "Erro interno do servidor"));
      }
    };
  }
}
