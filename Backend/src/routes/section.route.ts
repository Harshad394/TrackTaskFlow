import { Router } from "express";
import {
  createProjectSection,
  deleteSection,
  listProjectSections,
  updateSection,
} from "../controllers/section.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  requireProjectRole,
  requireSectionProjectRole,
} from "../middleware/projectPermission.middleware.js";

const router = Router();

router.post(
  "/projects/:projectId/sections",
  authMiddleware,
  requireProjectRole(["ADMIN"]),
  createProjectSection
);

router.get(
  "/projects/:projectId/sections",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listProjectSections
);

router.patch(
  "/sections/:sectionId",
  authMiddleware,
  requireSectionProjectRole(["ADMIN"]),
  updateSection
);

router.delete(
  "/sections/:sectionId",
  authMiddleware,
  requireSectionProjectRole(["ADMIN"]),
  deleteSection
);

export default router;
