import { Router } from "express";
import { deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead, } from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/notifications", authMiddleware, listNotifications);
router.patch("/notifications/read-all", authMiddleware, markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", authMiddleware, markNotificationRead);
router.delete("/notifications/:notificationId", authMiddleware, deleteNotification);
export default router;
