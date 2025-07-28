import { Router } from "express";
import { ListControllers } from "../controllers/list.controllers";
import { ValidateBody } from "../middlewares/validateBody.middlewares";
import { createListSchema, updateListSchema } from "../schemas/list.schema";
import { ValidateToken } from "../middlewares/validateToken.middlewares";

const router = Router();
const listControllers = new ListControllers();

router.post("/", ValidateToken.execute, ValidateBody.execute(createListSchema), listControllers.create);
router.get("/board/:boardId", listControllers.findManyByBoard);
router.get("/:id", listControllers.findOne);
router.patch("/:id", ValidateToken.execute, ValidateBody.execute(updateListSchema), listControllers.update);
router.delete("/:id", ValidateToken.execute, listControllers.delete);

export { router as listRouter }; 