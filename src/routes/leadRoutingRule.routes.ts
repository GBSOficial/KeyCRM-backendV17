import { Router } from "express";
import { LeadRoutingRuleControllers } from "../controllers/leadRoutingRule.controllers";
import { ValidateToken } from "../middlewares/validateToken.middlewares";
import { ensureDirector } from "../middlewares/ensureDirector";

const router = Router();
const controller = new LeadRoutingRuleControllers();

router.use(ValidateToken.execute, ensureDirector);

router.post("/", controller.create);
router.get("/", controller.findAll);
router.get("/:id", controller.findById);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router; 