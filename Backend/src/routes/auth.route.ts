import express from "express";
import { register, login, refreshAccessToken, logout } from "../controllers/auth.controller.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Rate-limited auth routes (10 req / 15 min per IP)
router.post("/register", registerRateLimiter, register);
router.post("/login",    loginRateLimiter,    login);

router.get("/logout",  logout);
router.post("/logout", logout);

router.get("/refresh",  refreshAccessToken);
router.post("/refresh", refreshAccessToken);

export default router;
