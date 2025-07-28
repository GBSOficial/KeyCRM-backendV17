import { Router } from "express";
import { UserControllers } from "../controllers/user.controllers";
import { ValidateBody } from "../middlewares/validateBody.middlewares";
import { userLoginBodySchema, userRegisterBodySchema } from "../schemas/user.schemas";
import { ValidateToken } from "../middlewares/validateToken.middlewares";
import { hasAnyPermission } from "../middlewares/hasPermission";
import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import fs from 'fs';

const router = Router();
const userControllers = new UserControllers();

// Configuração do multer para upload de imagens de perfil
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    // Usa path.resolve para garantir o caminho absoluto correto
    const uploadDir = path.resolve(process.cwd(), 'dist/uploads/Profile');
    
    // Garante que o diretório existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Verifica permissões do diretório
    try {
      fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      console.error('Erro de permissões no diretório de upload:', error);
      return cb(new Error('Erro de permissões no diretório de upload'), uploadDir);
    }

    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Remove caracteres especiais e espaços do nome original do arquivo
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
    const filename = 'profile-' + uniqueSuffix + path.extname(cleanFileName);

    cb(null, filename);
  }
});

// Configuração do multer com limites e filtros
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use apenas JPG, PNG ou GIF.'));
    }
  }
}).single('image'); // Configurando para um único arquivo com o nome 'image'

// Middleware de upload com tratamento de erro
const handleUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise<void>((resolve, reject) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          console.error('Erro Multer:', {
            code: err.code,
            field: err.field,
            message: err.message,
            stack: err.stack
          });
          reject(err);
        } else if (err) {
          console.error('Erro no upload:', {
            message: err.message,
            stack: err.stack
          });
          reject(err);
        }

        // Log após sucesso
        if (req.file) {
          // Verifica se o arquivo foi realmente salvo
          if (!fs.existsSync(req.file.path)) {
            console.error('Arquivo não foi salvo corretamente:', {
              path: req.file.path,
              destination: req.file.destination,
              dirContents: fs.existsSync(req.file.destination) ? fs.readdirSync(req.file.destination) : []
            });
            reject(new Error('Arquivo não foi salvo corretamente'));
            return;
          }
        }

        resolve();
      });
    });
    next();
  } catch (error) {
    const err = error as Error;
    console.error('Erro capturado no handleUpload:', {
      message: err.message,
      stack: err.stack
    });
    return res.status(400).json({ 
      error: `Erro no upload: ${err.message}` 
    });
  }
};

router.post("/",ValidateBody.execute(userRegisterBodySchema),userControllers.register);
router.post("/login",ValidateBody.execute(userLoginBodySchema),userControllers.login);
router.get("/", ValidateToken.execute, hasAnyPermission(['users_view', 'admin_access']), userControllers.findMany);
router.get("/chat-code/:chatCode", ValidateToken.execute, userControllers.findByChatCode);
router.post("/generate-chat-code", ValidateToken.execute, userControllers.generateChatCode);
router.get("/remaining-generations", ValidateToken.execute, userControllers.getRemainingCodeGenerations);
router.get("/:id", ValidateToken.execute ,userControllers.getUser);
router.patch("/:id", ValidateToken.execute ,userControllers.update);
router.patch("/:id/profile-image", ValidateToken.execute, handleUpload, userControllers.uploadProfileImage);
router.delete("/:id", hasAnyPermission(['users_delete', 'admin_access']), userControllers.delete);

// Rota de debug (temporária, sem autenticação)
router.get("/debug/users", userControllers.debugUsers);

export { router as userRouter };
