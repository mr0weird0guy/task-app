import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CreateTaskSchema, UpdateTaskSchema } from "../schemas/task.schema";
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTask,
} from "../controllers/task.controller";

const router = Router();

router.get("/", authenticate, getTasks);
router.post("/", authenticate, validate(CreateTaskSchema), createTask);
router.get("/:id", authenticate, getTaskById);
router.patch("/:id", authenticate, validate(UpdateTaskSchema), updateTask);
router.delete("/:id", authenticate, deleteTask);
router.post("/:id/toggle", authenticate, toggleTask);

export default router;
