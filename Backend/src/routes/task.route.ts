import { Router } from "express";
import {
  createSectionTask,
  deleteTask,
  getProjectBoard,
  getProjectTaskStats,
  getTask,
  listTaskActivities,
  listProjectTasks,
  listSectionTasks,
  moveTask,
  updateTask,
  requestApproval,
  approveTask,
  rejectTask,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  requireProjectRole,
  requireSectionProjectRole,
  requireTaskProjectRole,
} from "../middleware/projectPermission.middleware.js";

const router = Router();

router.get(
  "/projects/:projectId/board",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  getProjectBoard
);

router.get(
  "/projects/:projectId/tasks",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listProjectTasks
);

router.get(
  "/projects/:projectId/tasks/stats",
  authMiddleware,
  requireProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  getProjectTaskStats
);

router.post(
  "/sections/:sectionId/tasks",
  authMiddleware,
  requireSectionProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  createSectionTask
);

router.get(
  "/sections/:sectionId/tasks",
  authMiddleware,
  requireSectionProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  listSectionTasks
);

router.get(
  "/tasks/:taskId",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  getTask
);

router.get(
  "/tasks/:taskId/activity",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  listTaskActivities
);

router.patch(
  "/tasks/:taskId",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  updateTask
);

router.patch(
  "/tasks/:taskId/move",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  moveTask
);

router.delete(
  "/tasks/:taskId",
  authMiddleware,
  requireTaskProjectRole(["ADMIN"]),
  deleteTask
);

// ── Approval flow ────────────────────────────────────────────────────────────

// ADMIN, DEVELOPER, QA can submit a task for client review
router.patch(
  "/tasks/:taskId/request-approval",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA"]),
  requestApproval
);

// CLIENT approves (handler also allows ADMIN override)
router.patch(
  "/tasks/:taskId/approve",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  approveTask
);

// CLIENT rejects with reason (handler also allows ADMIN override)
router.patch(
  "/tasks/:taskId/reject",
  authMiddleware,
  requireTaskProjectRole(["ADMIN", "DEVELOPER", "QA", "CLIENT"]),
  rejectTask
);

export default router;
