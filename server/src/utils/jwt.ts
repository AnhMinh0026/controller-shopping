import type { Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../models/User";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const REFRESH_TOKEN_COOKIE_NAME = "flydigi_rt";

const getAccessSecret = (): string =>
  process.env.JWT_ACCESS_SECRET || "flydigi-access-secret-key-change-in-prod";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret()) as jwt.JwtPayload;
  return {
    sub: String(decoded.sub),
    role: (decoded.role as UserRole) || "customer",
  };
}

export function setRefreshTokenCookie(res: Response, rawToken: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth",
  });
}

