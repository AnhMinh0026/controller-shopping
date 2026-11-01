import express from "express";
import {
  deleteUserById,
  getAdminStats,
  getAllUsers,
  updateUserRole,
} from "../controllers/adminController";
import {
  getAllOrdersAdmin,
  simulateSepayPaymentAdmin,
  syncSepayOrdersAdmin,
  updateOrderStatusAdmin,
} from "../controllers/orderController";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware";

const router = express.Router();

// Every route under /api/admin requires a valid JWT + live "admin" role in DB
router.use(requireAuth, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUserById);

// Order & SePay Transaction Management
router.get("/orders", getAllOrdersAdmin);
router.patch("/orders/:id/status", updateOrderStatusAdmin);
router.post("/orders/sepay-sync", syncSepayOrdersAdmin);
router.post("/orders/:id/simulate-sepay", simulateSepayPaymentAdmin);

export default router;

