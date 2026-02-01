import { Router } from "express";
import {getMe} from "../controller/user.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router()

router.get("/me",authMiddleware , getMe);

export default router