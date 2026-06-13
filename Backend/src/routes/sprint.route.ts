import { Router } from "express";
import {
  createSprint,
  listSprints,
  updateSprint,
  addTaskToSprint,
  removeTaskFromSprint,
  getBacklog,
} from "../controllers/sprint.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  requireProjectRole,
  requireSprintProjectRole,
} from "../middleware/projectPermission.middleware.js";

const router = Router();

// ── Project-scoped sprint routes ─────────────────────────────────────────────

// All project members can list sprints and the backlog; only ADMIN/DEVELOPER/QA can create
router.get(
  "/projects/:projectId/sprints",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listSprints
);

router.post(
  "/projects/:projectId/sprints",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  createSprint
);

router.get(
  "/projects/:projectId/backlog",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  getBacklog
);

// ── Sprint-scoped routes ──────────────────────────────────────────────────────

// Update sprint details / status — ADMIN/DEVELOPER/QA only
router.patch(
  "/sprints/:sprintId",
  authMiddleware,
  requireSprintProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  updateSprint
);

// Add a task to a sprint (moves it out of backlog)
router.post(
  "/sprints/:sprintId/tasks/:taskId",
  authMiddleware,
  requireSprintProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  addTaskToSprint
);

// Remove a task from a sprint (sends it back to backlog)
router.delete(
  "/sprints/:sprintId/tasks/:taskId",
  authMiddleware,
  requireSprintProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  removeTaskFromSprint
);

export default router;
