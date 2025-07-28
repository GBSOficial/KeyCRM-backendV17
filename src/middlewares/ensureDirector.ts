import { Request, Response, NextFunction } from "express";
import { hasAnyPermission } from "./hasPermission";

// Middleware atualizado para usar sistema de permissões
export const ensureDirector = hasAnyPermission(['admin_access', 'admin_users']);

// Função legada mantida para compatibilidade (DEPRECATED)
export function ensureDirectorLegacy(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(403).json({ error: "Usuário não autenticado" });
  }

  // Verificar se o usuário é diretor ou está no departamento de diretoria
  const isDirector = req.user.offices?.includes("Diretor") || 
                    req.user.department === "Diretoria" ||
                    req.user.offices === "Diretor";

  if (isDirector) {
    return next();
  }
  
  return res.status(403).json({ error: "Acesso restrito a administradores" });
} 