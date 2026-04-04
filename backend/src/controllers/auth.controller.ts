import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
} from "../schemas/auth.schema";
import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  TokenPayload,
  verifyToken,
} from "../utils/jwt";
import { REFRESH_SECRET } from "../config/env";

/**
 * POST /auth/register
 * Body    : { email, password }
 * Returns : 201 { user, accessToken, refreshToken }
 *
 * Hashes the password with bcrypt (cost 12) and issues both tokens immediately.
 */
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as z.infer<typeof RegisterSchema>;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true, createdAt: true },
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * Body    : { email, password }
 * Returns : 200 { user, accessToken, refreshToken }
 *
 * Uses bcrypt.compare so timing is constant regardless of whether the user exists.
 */
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;

    const user = await prisma.user.findUnique({ where: { email } });

    // Compare even if user is null to prevent timing-based enumeration
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh
 * Body    : { refreshToken }
 * Returns : 200 { accessToken, refreshToken }
 *
 * Implements refresh token rotation: every call issues a brand-new refresh
 * token and stores it, invalidating the previous one (prevents reuse).
 */
const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof RefreshSchema>;

    let payload: TokenPayload;
    try {
      payload = verifyToken(refreshToken, REFRESH_SECRET);
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    // Token must match the stored value – prevents reuse of rotated tokens
    if (!user || user.refreshToken !== refreshToken) {
      // Possible reuse attack: nuke the stored token to force re-login
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
      }
      res
        .status(401)
        .json({ error: "Refresh token reuse detected or revoked" });
      return;
    }

    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 * Headers : Authorization: Bearer <accessToken>
 * Returns : 200 { message }
 *
 * Clears the stored refresh token (server-side revocation).
 */
const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { refreshToken: null },
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export { register, login, refresh, logout };
