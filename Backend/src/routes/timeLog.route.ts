import { Router } from "express";
import {
  createTaskTimeLog,
  deleteTimeLog,
  listProjectTimeLogs,
  listTaskTimeLogs,
  updateTimeLog,
} from "../controllers/timeLog.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  requireProjectRole,
  requireTaskProjectRole,
} from "../middleware/projectPermission.middleware.js";

const router = Router();

router.get(
  "/projects/:projectId/time-logs",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listProjectTimeLogs
);

router.post(
  "/tasks/:taskId/time-logs",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  createTaskTimeLog
);

router.get(
  "/tasks/:taskId/time-logs",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listTaskTimeLogs
);

router.patch("/time-logs/:timeLogId", authMiddleware, updateTimeLog);
router.delete("/time-logs/:timeLogId", authMiddleware, deleteTimeLog);

export default router;
