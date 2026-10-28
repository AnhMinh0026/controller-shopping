import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../models/User";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

/**
 * Verifies the Bearer Access Token in the Authorization header.
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      code: "TOKEN_MISSING",
      message: "Access token is required",
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED_OR_INVALID",
      message: "Access token is invalid or expired",
    });
  }
};

/**
 * Ensures the authenticated user has admin privileges.
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin privileges required",
    });
    return;
  }
  next();
};

