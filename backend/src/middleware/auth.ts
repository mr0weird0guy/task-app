import { RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";
import { ACCESS_SECRET } from "../config/env";

/**
 * authenticate
 * Validates the Bearer access token in the Authorization header.
 * Attaches `req.userId` on success.
 */
const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No access token provided" });
    return;
  }
  try {
    const payload = verifyToken(authHeader.slice(7), ACCESS_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};

export { authenticate };
