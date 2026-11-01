import express from "express";
import {
  cancelMyOrder,
  checkOrderPaymentStatus,
  confirmOrderReceivedByCustomer,
  createOrder,
  getMyOrders,
  getOrderById,
  handleSepayWebhook,
} from "../controllers/orderController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = express.Router();

// Public Webhook endpoint for SePay automatic transaction verification
router.post("/sepay-webhook", handleSepayWebhook);

// Authenticated customer order routes
router.post("/", requireAuth, createOrder);
router.get("/my-orders", requireAuth, getMyOrders);
router.get("/:id", requireAuth, getOrderById);
router.post("/:id/check-payment", requireAuth, checkOrderPaymentStatus);
router.post("/:id/confirm-received", requireAuth, confirmOrderReceivedByCustomer);
router.post("/:id/cancel", requireAuth, cancelMyOrder);

export default router;
