import { Router } from "express";
import { getProjectAnalytics } from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireProjectRole } from "../middleware/projectPermission.middleware.js";

const router = Router();

router.get(
  "/projects/:projectId/analytics",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  getProjectAnalytics
);

export default router;
