import { Router } from "express";
import { WebhookControllers } from "../controllers/webhook.controllers";

const router = Router();
const webhookControllers = new WebhookControllers();

router.route("/facebook-leads")
  .get(webhookControllers.handleFacebookLead)
  .post(webhookControllers.handleFacebookLead);

export default router; 