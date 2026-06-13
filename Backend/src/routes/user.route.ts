import { Router } from "express";
import {getMe, searchUsers} from "../controllers/user.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router()

router.get("/search", authMiddleware, searchUsers);
router.get("/me",authMiddleware , getMe);

export default router
