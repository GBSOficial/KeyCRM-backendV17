import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        offices?: string;
        department?: string | null;
        userRoles?: any[];
        userPermissions?: any[];
        roles?: string[];
        permissions?: string[];
      };
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    name?: string;
    email?: string;
    offices?: string;
    department?: string | null;
    userRoles?: any[];
    userPermissions?: any[];
    roles?: string[];
    permissions?: string[];
  }
}

export {}; 