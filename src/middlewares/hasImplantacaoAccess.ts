import { Request, Response, NextFunction } from 'express';
import { hasAnyPermission } from './hasPermission';

// Middleware atualizado para usar sistema de permissões
export const hasImplantacaoAccess = hasAnyPermission(['implantacao_access', 'admin_access']);

// Função legada mantida para compatibilidade (DEPRECATED)
interface AuthRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    offices?: string;
    department?: string | null;
  };
}

export const hasImplantacaoAccessLegacy = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const { department, offices } = authReq.user;
  
  if (department === 'IMPLANTACAO' || offices === 'IMPLANTACAO' || 
      department === 'Diretor' || offices === 'Diretor') {
    return next();
  }

  return res.status(403).json({ 
    error: 'Acesso negado. Apenas usuários do departamento de Implantação podem acessar esta funcionalidade.' 
  });
}; 