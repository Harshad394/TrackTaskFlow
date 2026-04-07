import {createTask,listAllTask,getOneTask,updateTask,deleteTask,taskCount} from "../controller/task.controller.js"
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router()

router.post("/tasks",authMiddleware, createTask)
router.get("/tasks",authMiddleware,listAllTask)
router.get("/tasks/:id",authMiddleware,getOneTask)
router.put("/tasks/:id",authMiddleware,updateTask)
router.delete("/tasks/:id",authMiddleware,deleteTask)
router.get("/stats",authMiddleware,taskCount)

export default router;