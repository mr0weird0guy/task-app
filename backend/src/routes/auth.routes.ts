import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
} from "../schemas/auth.schema";
import { authenticate } from "../middleware/auth";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);
router.post("/refresh", validate(RefreshSchema), refresh);
router.post("/logout", authenticate, logout);

export default router;
