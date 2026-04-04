import jwt from "jsonwebtoken";
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_TTL,
  REFRESH_TTL,
} from "../config/env";

interface TokenPayload {
  userId: string;
}

function signAccessToken(userId: string): string {
  return jwt.sign({ userId } as TokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId } as TokenPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

function verifyToken(token: string, secret: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}

export { signAccessToken, signRefreshToken, verifyToken, TokenPayload };
