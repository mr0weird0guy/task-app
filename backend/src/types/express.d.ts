import { JwtPayload } from "../config/env";

interface TokenPayload extends JwtPayload {
  userId: string;
}

// Extend Express Request to carry the authenticated user id
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
