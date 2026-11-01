import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import Order, { type IOrder } from "../models/Order";
import Product from "../models/Product";
import User from "../models/User";
import {
  buildPaymentInstructions,
  checkOrderViaSepayApi,
  extractOrderCodeFromContent,
  generateOrderCode,
  getSepayConfig,
  syncPendingOrdersWithSepay,
  type SepayWebhookPayload,
} from "../services/sepay.service";
import { normalizePhone } from "../utils/crypto";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1, "Product ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "Cart cannot be empty"),
  shippingInfo: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Recipient full name must be at least 2 characters")
      .max(80, "Recipient name is too long"),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+?84|0)[35789]\d{8}$/,
        "Invalid Vietnamese phone number (e.g. 0912345678)",
      ),
    address: z
      .string()
      .trim()
      .min(5, "Please enter a complete shipping address")
      .max(500, "Shipping address is too long"),
    note: z.string().trim().max(500).optional(),
  }),
  paymentMethod: z.enum(["qr", "cod"]),
  saveToProfile: z.boolean().optional(),
});

const updateOrderStatusSchema = z.object({
  orderStatus: z
    .enum(["pending", "processing", "shipping", "delivered", "cancelled"])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  shippingCarrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  cancelReason: z.string().trim().max(300).optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

function formatOrder(order: IOrder) {
  const populatedUser =
    order.user && typeof order.user === "object" && "name" in order.user
      ? (order.user as unknown as {
          _id: unknown;
          name: string;
          email?: string;
          phone?: string;
        })
      : null;

  return {
    id: String(order._id),
    orderCode: order.orderCode,
    userId: populatedUser ? String(populatedUser._id) : String(order.user),
    customerAccount: populatedUser
      ? {
          id: String(populatedUser._id),
          name: populatedUser.name,
          email: populatedUser.email,
          phone: populatedUser.phone,
        }
      : undefined,
    items: order.items.map((item) => ({
      productId: String(item.product),
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    totalAmount: order.totalAmount,
    shippingInfo: order.shippingInfo,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    shippingCarrier: order.shippingCarrier,
    trackingNumber: order.trackingNumber,
    cancelReason: order.cancelReason,
    sepayTransaction: order.sepayTransaction,
    trackingLogs: Array.isArray(order.trackingLogs) ? order.trackingLogs : [],
    paymentInstructions:
      order.paymentMethod === "qr"
        ? buildPaymentInstructions(order.orderCode, order.totalAmount)
        : undefined,
    confirmedAt: order.confirmedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function restoreOrderStock(order: IOrder): Promise<void> {
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
}

// [POST] /api/orders
export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid order data",
      });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { items, shippingInfo, paymentMethod, saveToProfile } = parsed.data;

    // Fetch products and validate stock
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const orderItems: IOrder["items"] = [];
    let totalAmount = 0;

    for (const reqItem of items) {
      const product = productMap.get(reqItem.productId);
      if (!product) {
        res.status(404).json({
          success: false,
          message: "One or more products in your cart no longer exist",
        });
        return;
      }

      if (product.stock < reqItem.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}" (Available: ${product.stock})`,
        });
        return;
      }

      const primaryImage =
        Array.isArray(product.images) && product.images[0]
          ? product.images[0]
          : "/images/products/vader-5-pro-showcase.png";

      orderItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: primaryImage,
        price: product.price,
        quantity: reqItem.quantity,
      });

      totalAmount += product.price * reqItem.quantity;
    }

    // Deduct stock
    for (const reqItem of items) {
      await Product.findByIdAndUpdate(reqItem.productId, {
        $inc: { stock: -reqItem.quantity },
      });
    }

    // Generate unique orderCode
    let orderCode = generateOrderCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await Order.exists({ orderCode });
      if (!exists) break;
      orderCode = generateOrderCode();
    }

    const normalizedShippingPhone = normalizePhone(shippingInfo.phone);
    const now = new Date();

    const initialLog =
      paymentMethod === "cod"
        ? {
            status: "pending" as const,
            title: "Order Placed (Cash on Delivery)",
            description:
              "Your COD order has been submitted. Waiting for Seller to confirm your address and prepare the package.",
            timestamp: now,
          }
        : {
            status: "pending" as const,
            title: "Order Placed (Awaiting QR Payment)",
            description:
              "Order created. Please complete the VietQR / Bank Transfer so SePay can automatically verify your payment.",
            timestamp: now,
          };

    // Shopee Workflow: Both COD ("To Confirm") and QR ("To Pay") start in "pending"
    const order = await Order.create({
      orderCode,
      user: userId,
      items: orderItems,
      totalAmount,
      shippingInfo: {
        fullName: shippingInfo.fullName,
        phone: normalizedShippingPhone,
        address: shippingInfo.address,
        note: shippingInfo.note || "",
      },
      paymentMethod,
      paymentStatus: "unpaid",
      orderStatus: "pending",
      trackingLogs: [initialLog],
    });

    // Save address & phone to customer profile if requested
    if (saveToProfile !== false) {
      const user = await User.findById(userId);
      if (user) {
        user.address = shippingInfo.address;
        if (!user.phone) {
          const phoneTaken = await User.exists({
            phone: normalizedShippingPhone,
            _id: { $ne: user._id },
          });
          if (!phoneTaken) {
            user.phone = normalizedShippingPhone;
          }
        }
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    res.status(500).json({ success: false, message });
  }
};

// [GET] /api/orders/my-orders
export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const orders = await Order.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: orders.map((order) => formatOrder(order as unknown as IOrder)),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load your orders";
    res.status(500).json({ success: false, message });
  }
};

// [GET] /api/orders/:id
export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (
      String(order.user) !== req.user?.userId &&
      req.user?.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to view this order",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load order details";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/orders/:id/check-payment
export const checkOrderPaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (
      String(order.user) !== req.user?.userId &&
      req.user?.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to check this order",
      });
      return;
    }

    // Already paid
    if (order.paymentStatus === "paid") {
      res.status(200).json({
        success: true,
        paid: true,
        message: "Payment has been verified!",
        data: formatOrder(order),
      });
      return;
    }

    // Actively check SePay API if configured
    if (order.paymentMethod === "qr" && order.paymentStatus === "unpaid") {
      try {
        const matchedTx = await checkOrderViaSepayApi(order);
        if (matchedTx) {
          order.paymentStatus = "paid";
          if (order.orderStatus === "pending") {
            order.orderStatus = "processing";
            order.confirmedAt = new Date();
          }
          order.sepayTransaction = matchedTx;
          order.trackingLogs.push({
            status: "processing",
            title: "Payment Verified via SePay",
            description: `Bank transfer confirmed (Ref: ${matchedTx.referenceCode || "N/A"}). Seller is packing your order.`,
            timestamp: new Date(),
          });
          await order.save();

          res.status(200).json({
            success: true,
            paid: true,
            message: "Payment verified automatically via SePay!",
            data: formatOrder(order),
          });
          return;
        }
      } catch {
        // Ignore SePay API errors during polling and return current DB status
      }
    }

    res.status(200).json({
      success: true,
      paid: false,
      message: "Waiting for bank transfer confirmation...",
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check payment status";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/orders/:id/confirm-received
// Shopee-style Customer Action: "Order Received" (Đã nhận được hàng)
export const confirmOrderReceivedByCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (String(order.user) !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: "You can only confirm receipt for your own orders",
      });
      return;
    }

    if (order.orderStatus !== "shipping") {
      res.status(400).json({
        success: false,
        message: "Only orders currently in transit can be marked as received",
      });
      return;
    }

    order.orderStatus = "delivered";
    order.deliveredAt = new Date();
    if (order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    order.trackingLogs.push({
      status: "delivered",
      title: "Order Received by Customer",
      description:
        order.paymentMethod === "cod"
          ? "Customer confirmed package receipt and completed COD payment."
          : "Customer confirmed package receipt in good condition.",
      timestamp: new Date(),
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Thank you! Your order has been marked as completed.",
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm order receipt";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/orders/:id/cancel
export const cancelMyOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (String(order.user) !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
      return;
    }

    if (order.orderStatus !== "pending") {
      res.status(400).json({
        success: false,
        message:
          "This order has already been confirmed/packed by the seller and can no longer be cancelled.",
      });
      return;
    }

    const parsed = cancelOrderSchema.safeParse(req.body || {});
    const reason =
      parsed.success && parsed.data.reason
        ? parsed.data.reason
        : "Cancelled by customer";

    await restoreOrderStock(order);
    order.orderStatus = "cancelled";
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    order.trackingLogs.push({
      status: "cancelled",
      title: "Order Cancelled by Customer",
      description: `Reason: ${reason}. Reserved stock has been returned to inventory.`,
      timestamp: new Date(),
    });
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order has been cancelled",
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel order";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/orders/sepay-webhook
// Public Webhook receiver for SePay (https://my.sepay.vn)
export const handleSepayWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { webhookApiKey } = getSepayConfig();
    if (webhookApiKey) {
      const authHeader = req.headers.authorization || "";
      const expectedHeader = `Apikey ${webhookApiKey}`;
      if (authHeader.trim() !== expectedHeader) {
        res.status(401).json({
          success: false,
          message: "Invalid SePay webhook API key",
        });
        return;
      }
    }

    const payload = req.body as SepayWebhookPayload;
    if (payload.transferType && payload.transferType !== "in") {
      res.status(200).json({
        success: true,
        message: "Ignored outgoing transaction",
      });
      return;
    }

    const rawText = `${payload.content || ""} ${payload.code || ""} ${
      payload.description || ""
    }`;
    const extractedCode = extractOrderCodeFromContent(rawText);

    if (!extractedCode) {
      res.status(200).json({
        success: true,
        message: "No matching Flydigi order code found in transfer content",
      });
      return;
    }

    const order = await Order.findOne({ orderCode: extractedCode });
    if (!order) {
      res.status(200).json({
        success: true,
        message: `Order ${extractedCode} not found`,
      });
      return;
    }

    if (order.paymentStatus === "paid") {
      res.status(200).json({
        success: true,
        message: `Order ${extractedCode} is already marked as paid`,
      });
      return;
    }

    const transferAmount = Number(payload.transferAmount || 0);
    if (transferAmount < order.totalAmount) {
      res.status(200).json({
        success: false,
        message: `Transfer amount (${transferAmount}) is less than order total (${order.totalAmount})`,
      });
      return;
    }

    order.paymentStatus = "paid";
    if (order.orderStatus === "pending") {
      order.orderStatus = "processing";
      order.confirmedAt = new Date();
    }
    order.sepayTransaction = {
      transactionId: String(payload.id || Date.now()),
      gateway: payload.gateway || "SePay Webhook",
      transferAmount,
      referenceCode: payload.referenceCode || "",
      content: payload.content || extractedCode,
      paidAt: payload.transactionDate
        ? new Date(payload.transactionDate)
        : new Date(),
    };
    order.trackingLogs.push({
      status: "processing",
      title: "Payment Verified via SePay Webhook",
      description: `Received transfer via ${payload.gateway || "Bank"} (Ref: ${payload.referenceCode || "N/A"}). Seller is preparing your package.`,
      timestamp: new Date(),
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${order.orderCode} payment verified via SePay`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing error";
    res.status(500).json({ success: false, message });
  }
};

// ==========================================
// ADMIN ORDER CONTROLLERS (SHOPEE SELLER FLOW)
// ==========================================

// [GET] /api/admin/orders
export const getAllOrdersAdmin = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    const config = getSepayConfig();

    res.status(200).json({
      success: true,
      data: orders.map((order) => formatOrder(order as unknown as IOrder)),
      sepayInfo: {
        bankCode: config.bankCode,
        accountNumber: config.accountNumber,
        accountName: config.accountName,
        isApiConfigured: config.isApiConfigured,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load orders";
    res.status(500).json({ success: false, message });
  }
};

// [PATCH] /api/admin/orders/:id/status
export const updateOrderStatusAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid status update",
      });
      return;
    }

    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email phone",
    );
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const {
      orderStatus,
      paymentStatus,
      shippingCarrier,
      trackingNumber,
      cancelReason,
    } = parsed.data;

    if (orderStatus && orderStatus !== order.orderStatus) {
      const now = new Date();

      if (orderStatus === "processing") {
        order.confirmedAt = now;
        order.trackingLogs.push({
          status: "processing",
          title: "Order Confirmed by Seller",
          description:
            order.paymentMethod === "cod"
              ? "Seller confirmed your COD order and is packing your items for carrier pickup."
              : "Seller confirmed your order and is preparing the package.",
          timestamp: now,
        });
      } else if (orderStatus === "shipping") {
        const carrier =
          shippingCarrier || order.shippingCarrier || "SPX Express";
        const tracking =
          trackingNumber ||
          order.trackingNumber ||
          `SPXVN${Date.now().toString().slice(-8)}`;

        order.shippingCarrier = carrier;
        order.trackingNumber = tracking;
        order.shippedAt = now;
        order.trackingLogs.push({
          status: "shipping",
          title: `Handed Over to ${carrier}`,
          description: `Package picked up by ${carrier} (Tracking No: ${tracking}). Delivering to ${order.shippingInfo.fullName} (${order.shippingInfo.phone}) at "${order.shippingInfo.address}".`,
          timestamp: now,
        });
      } else if (orderStatus === "delivered") {
        order.deliveredAt = now;
        if (order.paymentMethod === "cod") {
          order.paymentStatus = "paid";
        }
        order.trackingLogs.push({
          status: "delivered",
          title: "Delivered Successfully",
          description:
            order.paymentMethod === "cod"
              ? "Courier delivered package to recipient and collected COD payment in full."
              : "Courier delivered package to recipient at destination address.",
          timestamp: now,
        });
      } else if (
        orderStatus === "cancelled" &&
        order.orderStatus !== "cancelled"
      ) {
        await restoreOrderStock(order);
        const reason = cancelReason || "Cancelled by Seller / Admin";
        order.cancelReason = reason;
        order.cancelledAt = now;
        order.trackingLogs.push({
          status: "cancelled",
          title: "Order Cancelled by Seller",
          description: `Reason: ${reason}. Item stock has been restored.`,
          timestamp: now,
        });
      }

      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${order.orderCode} updated successfully`,
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order status";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/admin/orders/sepay-sync
export const syncSepayOrdersAdmin = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await syncPendingOrdersWithSepay();
    res.status(200).json({
      success: true,
      message: result.apiConfigured
        ? `Synced with SePay: ${result.matchedCount} of ${result.checkedCount} pending QR order(s) verified.`
        : "SEPAY_API_TOKEN is not configured in .env yet. Using webhook / manual simulation mode.",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync transactions from SePay";
    res.status(500).json({ success: false, message });
  }
};

// [POST] /api/admin/orders/:id/simulate-sepay
export const simulateSepayPaymentAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email phone",
    );
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        message: "Order is already marked as paid",
      });
      return;
    }

    const config = getSepayConfig();
    const now = new Date();
    const refCode = `FT${Date.now()}`;

    order.paymentStatus = "paid";
    if (order.orderStatus === "pending") {
      order.orderStatus = "processing";
      order.confirmedAt = now;
    }
    order.sepayTransaction = {
      transactionId: `SEPAY-${Date.now().toString().slice(-6)}`,
      gateway: config.bankCode,
      transferAmount: order.totalAmount,
      referenceCode: refCode,
      content: `${order.orderCode} Flydigi Order Payment`,
      paidAt: now,
    };
    order.trackingLogs.push({
      status: "processing",
      title: "Payment Verified via SePay",
      description: `Verified transfer of ${order.totalAmount} VND via ${config.bankCode} (Ref: ${refCode}). Seller is packing your order.`,
      timestamp: now,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `SePay payment verified for order ${order.orderCode}! Ready to ship.`,
      data: formatOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to verify SePay payment";
    res.status(500).json({ success: false, message });
  }
};
