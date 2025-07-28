import { Router } from "express";
import { NotificationControllers } from "../controllers/notification.controllers";
import { ValidateToken } from "../middlewares/validateToken.middlewares";

const notificationControllers = new NotificationControllers();
const router = Router();

router.post("/", ValidateToken.execute, notificationControllers.create);
router.get("/:userId", ValidateToken.execute, notificationControllers.findMany);
router.patch("/:userId/:id/read", ValidateToken.execute, notificationControllers.markAsRead);
router.patch("/:userId/read-all", ValidateToken.execute, notificationControllers.markAllAsRead);
router.delete("/:userId/:id", ValidateToken.execute, notificationControllers.delete);

export { router as notificationRouter }; 