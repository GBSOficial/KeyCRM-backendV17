import "express-async-errors";
import express, { json, Request, Response, NextFunction, ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import cors from "cors";
import { userRouter } from "./routes/user.routes";
import { HandleErrors } from "./middlewares/handleErrors.middlewares";
import swaggerDocs from "./swagger.json";
import { leadRouter } from "./routes/lead.routes";
import { apiTokenRouter } from "./routes/apiToken.routes";
import { boardRouter } from "./routes/board.routes";
import { listRouter } from "./routes/list.routes";
import { cardRouter } from "./routes/card.routes";
import { notificationRouter } from "./routes/notification.routes";
import { taskRouter } from "./routes/task.routes";
import path from "path";
import fs from 'fs';
import { chatRouter } from "./routes/chat.routes";
import mime from 'mime';
import { clientRoutes } from "./routes/client.routes";
import { projectRoutes } from "./routes/project.routes";
import { adminRoutes } from "./routes/admin.routes";
import webhookRouter from "./routes/webhook.routes";
import leadRoutingRuleRouter from "./routes/leadRoutingRule.routes";
import emailMarketingRouter from "./routes/emailMarketing.routes";
import { permissionRoutes, testRoutes } from "./routes/permission.routes";

// Definindo o caminho do diretório de uploads
const uploadDir = path.join(__dirname, '..', 'dist', 'uploads');

// Criando o diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Criando o diretório Profile se não existir
const profileUploadDir = path.join(uploadDir, 'Profile');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Criando o diretório ChatInterno se não existir
const chatUploadDir = path.join(uploadDir, 'ChatInterno');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

// Verificando permissões e estrutura
try {
  fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
} catch (error) {
  console.error('Erro de permissões nos diretórios:', error);
}

export const app = express();

// Configuração do CORS
app.use(cors({
  origin: ['https://arc.poppys.pt', 'https://arc.atnzo.app', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:63541'],
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Configuração do Helmet com ajustes para servir imagens
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      connectSrc: ["'self'", "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:", "*"],
      mediaSrc: ["'self'", "data:", "*"]
    }
  }
}));

app.use(json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Configuração para servir arquivos estáticos
const uploadsPath = path.join(__dirname, '..', 'dist', 'uploads');


// Middleware para servir arquivos estáticos
app.use('/uploads', (req, res, next) => {
  next();
}, express.static(uploadsPath));

// Rota de fallback para arquivos não encontrados
app.use('/uploads/*', (req, res) => {
  const filePath = path.join(uploadsPath, req.path.replace(/^\/+/, ''));
  res.status(404).send('Arquivo não encontrado');
});

// Rotas da API
app.use("/v1/user", userRouter);
app.use("/v1/lead", leadRouter);
app.use("/v1/apitoken", apiTokenRouter);
app.use("/v1/board", boardRouter);
app.use("/v1/list", listRouter);
app.use("/v1/card", cardRouter);
app.use("/v1/notification", notificationRouter);
app.use("/v1/task", taskRouter);
app.use("/v1/chat", chatRouter);
app.use("/v1/clients", clientRoutes);
app.use("/v1/projects", projectRoutes);
app.use("/v1/admin", adminRoutes);
app.use("/v1/webhooks", webhookRouter);
app.use("/v1/lead-routing-rules", leadRoutingRuleRouter);
app.use("/v1/email-marketing", emailMarketingRouter);
app.use("/v1/permissions", permissionRoutes);
app.use("/v1/test", testRoutes);

// Middleware de tratamento de erros
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  return HandleErrors.execute(err, req as Request, res, next);
};

app.use(errorHandler);


