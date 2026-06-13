import { Router } from "express";
import {
  createOrganization,
  getOrganization,
  listOrganizations,
  listOrgMembers,
  addOrgMember,
  updateOrgMember,
  removeOrgMember,
} from "../controllers/organization.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// ── Organization CRUD ────────────────────────────────────────────────────────
router.post("/organizations",                authMiddleware, createOrganization);
router.get("/organizations",                 authMiddleware, listOrganizations);
router.get("/organizations/:organizationId", authMiddleware, getOrganization);

// ── Organization member management ──────────────────────────────────────────
router.get(    "/organizations/:organizationId/members",          authMiddleware, listOrgMembers);
router.post(   "/organizations/:organizationId/members",          authMiddleware, addOrgMember);
router.patch(  "/organizations/:organizationId/members/:userId",  authMiddleware, updateOrgMember);
router.delete( "/organizations/:organizationId/members/:userId",  authMiddleware, removeOrgMember);

export default router;
