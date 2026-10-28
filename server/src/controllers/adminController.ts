import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import Product from "../models/Product";
import RefreshToken from "../models/RefreshToken";
import User, { type IUser } from "../models/User";

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "customer"]),
});

function formatAdminUser(user: IUser) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

// [GET] /api/admin/stats
export const getAdminStats = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalCustomers,
      totalProducts,
      outOfStockProducts,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments({}),
      Product.countDocuments({ stock: { $lte: 0 } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalCustomers,
        totalProducts,
        outOfStockProducts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin stats";
    res.status(500).json({ success: false, message });
  }
};

// [GET] /api/admin/users
export const getAllUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users.map(formatAdminUser),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load users";
    res.status(500).json({ success: false, message });
  }
};

// [PATCH] /api/admin/users/:id/role
export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const targetUserId = String(req.params.id || "");
    const parsed = updateUserRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid role. Allowed values: 'admin' or 'customer'.",
      });
      return;
    }

    // Prevent an admin from accidentally demoting their own active account
    if (req.user?.userId === targetUserId && parsed.data.role !== "admin") {
      res.status(400).json({
        success: false,
        message: "You cannot demote your own admin account.",
      });
      return;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.role = parsed.data.role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Updated ${user.name}'s role to ${user.role}.`,
      data: formatAdminUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user role";
    res.status(500).json({ success: false, message });
  }
};

// [DELETE] /api/admin/users/:id
export const deleteUserById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const targetUserId = String(req.params.id || "");

    if (req.user?.userId === targetUserId) {
      res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
      return;
    }

    const user = await User.findByIdAndDelete(targetUserId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Revoke and delete all refresh tokens belonging to the deleted user
    await RefreshToken.deleteMany({ userId: user._id });

    res.status(200).json({
      success: true,
      message: `Deleted user ${user.name} successfully.`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    res.status(500).json({ success: false, message });
  }
};

