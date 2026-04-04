import { z } from "zod";
import { TaskStatus } from "../config/prisma";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  body: z.string().max(10_000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  body: z.string().max(10_000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export { CreateTaskSchema, UpdateTaskSchema };
