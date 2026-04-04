import { prisma, TaskStatus, Prisma } from "../config/prisma";
import { Request, Response, NextFunction } from "express";
import { CreateTaskSchema, UpdateTaskSchema } from "../schemas/task.schema";
import z from "zod";

/**
 * GET /tasks
 * Protected. Query params:
 *   page   (default 1)
 *   limit  (default 10, max 100)
 *   status PENDING | IN_PROGRESS | DONE
 *   search keyword matched against task title
 *
 * Returns: { data: Task[], meta: { total, page, limit, totalPages } }
 */
const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const statusParam = req.query.status as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    const validStatus =
      statusParam &&
      Object.values(TaskStatus).includes(statusParam as TaskStatus)
        ? (statusParam as TaskStatus)
        : undefined;

    const where: Prisma.TaskWhereInput = {
      userId: req.userId!,
      ...(validStatus ? { status: validStatus } : {}),
      ...(search ? { title: { contains: search } } : {}),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tasks
 * Protected.
 * Body    : { title, body?, status? }
 * Returns : 201 Task
 */
const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, status } = req.body as z.infer<
      typeof CreateTaskSchema
    >;

    const task = await prisma.task.create({
      data: {
        title,
        body,
        status: status ?? TaskStatus.PENDING,
        userId: req.userId!,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/:id
 * Protected. Returns the task if it belongs to the authenticated user.
 */
const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id.toString();
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (task.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tasks/:id
 * Protected. Partial update – only provided fields are changed.
 * Body    : { title?, body?, status? }
 * Returns : updated Task
 */
const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id.toString();
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (existing.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { title, body, status } = req.body as z.infer<
      typeof UpdateTaskSchema
    >;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /tasks/:id
 * Protected. Only the owner can delete.
 * Returns : 204 No Content
 */
const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id.toString();
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (existing.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tasks/:id/toggle
 * Protected. Cycles status:  PENDING → IN_PROGRESS → DONE → PENDING
 * Returns : updated Task
 */
const toggleTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id.toString();

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (existing.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const cycle: Record<TaskStatus, TaskStatus> = {
      [TaskStatus.PENDING]: TaskStatus.IN_PROGRESS,
      [TaskStatus.IN_PROGRESS]: TaskStatus.DONE,
      [TaskStatus.DONE]: TaskStatus.PENDING,
    };

    const updated = await prisma.task.update({
      where: { id },
      data: { status: cycle[existing.status] },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTask,
};
