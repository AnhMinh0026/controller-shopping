import express from "express";
import {
  deleteUserById,
  getAdminStats,
  getAllUsers,
  updateUserRole,
} from "../controllers/adminController";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware";

const router = express.Router();

// Every route under /api/admin requires a valid JWT + live "admin" role in DB
router.use(requireAuth, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUserById);

export default router;

