import { Router } from "express";
import {
  addProjectMember,
  cancelProjectInvitation,
  createProject,
  getProject,
  inviteProjectMember,
  listProjectInvitations,
  listProjects,
  removeProjectMember,
  updateProject,
  updateProjectMember,
} from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/organizations/:organizationId/projects", authMiddleware, createProject);
router.get("/organizations/:organizationId/projects", authMiddleware, listProjects);
router.get("/projects/:projectId", authMiddleware, getProject);
router.patch("/projects/:projectId", authMiddleware, updateProject);
router.post("/projects/:projectId/members", authMiddleware, addProjectMember);
router.post("/projects/:projectId/invitations", authMiddleware, inviteProjectMember);
router.get("/projects/:projectId/invitations", authMiddleware, listProjectInvitations);
router.patch(
  "/projects/:projectId/invitations/:invitationId/cancel",
  authMiddleware,
  cancelProjectInvitation
);
router.patch("/projects/:projectId/members/:userId", authMiddleware, updateProjectMember);
router.delete("/projects/:projectId/members/:userId", authMiddleware, removeProjectMember);

export default router;
