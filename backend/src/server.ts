// Dependencies
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PORT } from "./config/env";
import { default as authRoutes } from "./routes/auth.routes";
import { default as taskRoutes } from "./routes/task.routes";
import { generalError } from "./middleware/error";

const app = express();
app.use(express.json());

// CORS policy
app.use(
  cors({
    origin: "http://localhost:4000",
    credentials: true,
  }),
);

// boiler code in case of any error
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({ error: "Internal server error" });
    return generalError(err);
  },
);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 2 major routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
