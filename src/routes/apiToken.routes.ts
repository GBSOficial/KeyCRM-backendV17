import { Router } from "express";
import { ApiTokenControllers } from "../controllers/apiToken.controllers";
import { ValidateToken } from "../middlewares/validateToken.middlewares";

const router = Router();
const apiTokenControllers = new ApiTokenControllers();

router.post("/", ValidateToken.execute, apiTokenControllers.create);
router.get("/", ValidateToken.execute, apiTokenControllers.findMany);
router.get("/:id", ValidateToken.execute, apiTokenControllers.findOne);
router.patch("/:id", ValidateToken.execute, apiTokenControllers.update);
router.delete("/:id", ValidateToken.execute, apiTokenControllers.delete);

export { router as apiTokenRouter };
