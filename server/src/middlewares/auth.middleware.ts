import type { NextFunction, Request, Response } from "express";
import User, { type UserRole } from "../models/User";
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
 * Role-Based Access Control (RBAC) middleware factory.
 * Verifies the user's live role in MongoDB so role changes (promote/demote)
 * take effect immediately without waiting for the JWT access token to expire.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
        return;
      }

      const dbUser = await User.findById(req.user.userId).select("role");
      if (!dbUser) {
        res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "User account no longer exists",
        });
        return;
      }

      req.user.role = dbUser.role;

      if (!allowedRoles.includes(dbUser.role)) {
        res.status(403).json({
          success: false,
          code: "FORBIDDEN_INSUFFICIENT_ROLE",
          requiredRoles: allowedRoles,
          currentRole: dbUser.role,
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({
        success: false,
        message: "Failed to verify user role permissions",
      });
    }
  };
};

/**
 * Ensures the authenticated user has `admin` privileges.
 */
export const requireAdmin = requireRole("admin");

/**
 * Ensures the authenticated user has at least `customer` (or `admin`) privileges.
 */
export const requireCustomer = requireRole("customer", "admin");
