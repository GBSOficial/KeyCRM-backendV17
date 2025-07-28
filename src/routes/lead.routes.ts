import { Router } from "express";
import { LeadControllers } from "../controllers/lead.controllers";
import { LeadImportControllers } from "../controllers/leadImport.controllers";
import { createLeadSchema, updateLeadSchema } from "../schemas/lead.schema";
import { ValidateToken } from "../middlewares/validateToken.middlewares";
import { uploadConfig } from "../middlewares/upload.middlewares";
import { LeadServices } from "../services/lead.services";
import { hasAnyPermission, hasPermission } from "../middlewares/hasPermission";

const router = Router();
const leadControllers = new LeadControllers();
const leadImportControllers = new LeadImportControllers();
const leadService = new LeadServices();

router.post("/", ValidateToken.execute, hasAnyPermission(['leads_create', 'admin_access']), leadControllers.create);
router.get("/", ValidateToken.execute, hasAnyPermission(['leads_view_own', 'leads_view_all', 'admin_access']), leadControllers.findMany);
router.get("/:id", ValidateToken.execute, hasAnyPermission(['leads_view_own', 'leads_view_all', 'admin_access']), leadControllers.findOne);
router.patch("/:id", ValidateToken.execute, hasAnyPermission(['leads_edit', 'admin_access']), leadControllers.update);
router.delete("/:id", ValidateToken.execute, hasAnyPermission(['leads_delete', 'admin_access']), leadControllers.delete);

// Rotas para aprovação de conversão
router.post("/:id/approve-conversion", ValidateToken.execute, leadControllers.approveConversion);
router.post("/:id/reject-conversion", ValidateToken.execute, leadControllers.rejectConversion);
router.get("/approved/for-conversion", ValidateToken.execute, leadControllers.getApprovedForConversion);
router.post("/:id/mark-converted", ValidateToken.execute, leadControllers.markAsConverted);

router.post("/import/simulate", ValidateToken.execute, leadImportControllers.simulate);
router.post("/import", ValidateToken.execute, leadImportControllers.import);
router.post(
  "/import/file/simulate",
  ValidateToken.execute,
  uploadConfig.single('file'),
  leadImportControllers.simulateFile
);
router.post(
  "/import/file",
  ValidateToken.execute,
  uploadConfig.single('file'),
  leadImportControllers.importFile
);

export { router as leadRouter };
