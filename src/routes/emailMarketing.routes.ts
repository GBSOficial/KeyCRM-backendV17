import { Router } from "express";
import { EmailTemplateControllers } from "../controllers/emailTemplate.controllers";
import { EmailConfigControllers } from "../controllers/emailConfig.controllers";
import { EmailSendControllers } from "../controllers/emailSend.controllers";
import { ValidateToken } from "../middlewares/validateToken.middlewares";

const router = Router();
const emailTemplateControllers = new EmailTemplateControllers();
const emailConfigControllers = new EmailConfigControllers();
const emailSendControllers = new EmailSendControllers();

// Middleware de autenticação para todas as rotas
router.use(ValidateToken.execute);

// Rotas para Templates de E-mail
router.post("/templates", emailTemplateControllers.create);
router.get("/templates", emailTemplateControllers.findAll);
router.get("/templates/categories", emailTemplateControllers.getCategories);
router.get("/templates/:id", emailTemplateControllers.findById);
router.put("/templates/:id", emailTemplateControllers.update);
router.delete("/templates/:id", emailTemplateControllers.delete);

// Rotas para Configurações SMTP
router.post("/configs", emailConfigControllers.create);
router.get("/configs", emailConfigControllers.findAll);
router.get("/configs/:id", emailConfigControllers.findById);
router.put("/configs/:id", emailConfigControllers.update);
router.delete("/configs/:id", emailConfigControllers.delete);
router.post("/configs/test", emailConfigControllers.testConnection);

// Rotas para Envio de E-mails
router.post("/send", emailSendControllers.sendEmail);
router.post("/send/bulk", emailSendControllers.sendBulkEmail);
router.get("/sends", emailSendControllers.findAll);
router.get("/sends/stats", emailSendControllers.getStats);
router.get("/variables", emailSendControllers.getAvailableVariables);

export default router; 