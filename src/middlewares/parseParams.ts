import { Request, Response, NextFunction } from 'express';

export function parseIntParams(paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      if (req.params[paramName]) {
        const parsed = parseInt(req.params[paramName], 10);
        if (isNaN(parsed)) {
          return res.status(400).json({
            error: `Parâmetro ${paramName} deve ser um número válido`
          });
        }
        // Adicionar o valor parseado ao req.params como um número
        (req.params as any)[paramName + 'Parsed'] = parsed;
      }
    }
    next();
  };
} 