import { Router } from "express";
import { CardControllers } from "../controllers/card.controllers";
import { ValidateBody } from "../middlewares/validateBody.middlewares";
import { createCardSchema, updateCardSchema } from "../schemas/card.schema";

const router = Router();
const cardControllers = new CardControllers();

router.post("/", ValidateBody.execute(createCardSchema), cardControllers.create);
router.get("/list/:listId", cardControllers.findManyByList);
router.get("/:id", cardControllers.findOne);
router.patch("/:id", ValidateBody.execute(updateCardSchema), cardControllers.update);
router.delete("/:id", cardControllers.delete);

export { router as cardRouter }; 