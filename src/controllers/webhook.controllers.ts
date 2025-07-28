import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { WebhookServices } from "../services/webhook.services";

const prisma = new PrismaClient();
const webhookServices = new WebhookServices();

export class WebhookControllers {
  async handleFacebookLead(req: Request, res: Response) {
    try {
      // Verificar se é uma requisição de verificação do Meta
      if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"]) {
        const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN;
        if (req.query["hub.verify_token"] === verifyToken) {
          return res.status(200).send(req.query["hub.challenge"]);
        }
        return res.status(403).send("Token de verificação inválido");
      }

      // Processar o lead recebido
      const leadData = req.body;
      
      // Extrair informações do lead do Meta
      const lead = {
        name: leadData.entry[0].changes[0].value.leadgen_id,
        email: leadData.entry[0].changes[0].value.email,
        phone: leadData.entry[0].changes[0].value.phone_number,
        source: "Facebook Lead Ads",
        status: "NOVO",
        userId: 1, // ID do usuário padrão que receberá os leads
        notes: `Formulário: ${leadData.entry[0].changes[0].value.form_name}\nPágina: ${leadData.entry[0].changes[0].value.page_name}`
      };

      // Criar o lead no banco de dados
      const createdLead = await webhookServices.createLead(lead);

      return res.status(200).json({ success: true, lead: createdLead });
    } catch (error) {
      console.error("Erro ao processar webhook do Facebook:", error);
      return res.status(500).json({ error: "Erro ao processar webhook" });
    }
  }
} 