import { Router } from "express";
import { createOrganization, getOrganization, listOrganizations, } from "../controllers/organization.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.post("/organizations", authMiddleware, createOrganization);
router.get("/organizations", authMiddleware, listOrganizations);
router.get("/organizations/:organizationId", authMiddleware, getOrganization);
export default router;
