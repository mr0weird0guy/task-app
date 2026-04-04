import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing env variable: ${key}`);
  return value;
}

const PORT = Number(env("PORT", "3000"));
const ACCESS_SECRET = env("JWT_ACCESS_SECRET", "dev-access-secret");
const REFRESH_SECRET = env("JWT_REFRESH_SECRET", "dev-refresh-secret");
const ACCESS_TTL = env("ACCESS_TOKEN_TTL", "15m") as SignOptions["expiresIn"];
const REFRESH_TTL = env("REFRESH_TOKEN_TTL", "7d") as SignOptions["expiresIn"];

export {
  jwt,
  JwtPayload,
  PORT,
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_TTL,
  REFRESH_TTL,
};
