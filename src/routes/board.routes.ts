import { Router } from "express";
import { BoardControllers } from "../controllers/board.controllers";
import { ValidateBody } from "../middlewares/validateBody.middlewares";
import { createBoardSchema, updateBoardSchema } from "../schemas/board.schema";
import { ValidateToken } from "../middlewares/validateToken.middlewares";

const router = Router();
const boardControllers = new BoardControllers();

router.post("/", ValidateToken.execute, ValidateBody.execute(createBoardSchema), boardControllers.create);
router.get("/", boardControllers.findMany);
router.get("/:id", boardControllers.findOne);
router.patch("/:id", ValidateToken.execute, ValidateBody.execute(updateBoardSchema), boardControllers.update);
router.delete("/:id", ValidateToken.execute, boardControllers.delete);

export { router as boardRouter }; 