import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import QrPaymentModal from "../../../components/common/QrPaymentModal";
import {
  orderService,
  type OrderRecord,
  type OrderStatus,
} from "../../../services/order.service";
import { formatVND } from "../../../utils/formatCurrency";

const SHOPEE_TABS: Array<{ id: "ALL" | OrderStatus; label: string }> = [
  { id: "ALL", label: "All Orders" },
  { id: "pending", label: "To Confirm / Pay" },
  { id: "processing", label: "To Ship" },
  { id: "shipping", label: "To Receive" },
  { id: "delivered", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const CANCEL_REASONS = [
  "Want to change delivery address or phone number",
  "Want to change payment method (COD / VietQR)",
  "Want to modify items or quantity in order",
  "Changed mind / No longer needed",
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case "pending":
      return 1;
    case "processing":
      return 2;
    case "shipping":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

export default function CustomerOrdersList() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedQrOrder, setSelectedQrOrder] = useState<OrderRecord | null>(
    null,
  );
  const [expandedTrackingIds, setExpandedTrackingIds] = useState<
    Record<string, boolean>
  >({});

  // Cancel Modal state (Shopee style reason picker)
  const [cancelTarget, setCancelTarget] = useState<OrderRecord | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(
    CANCEL_REASONS[0] ?? "Cancelled by customer",
  );
  const [isSubmittingAction, setIsSubmittingAction] = useState<string | null>(
    null,
  );

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch {
      toast.error("Failed to load your order history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void orderService
      .getMyOrders()
      .then((data) => {
        if (isMounted) setOrders(data);
      })
      .catch(() => {
        if (isMounted) toast.error("Failed to load your order history");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTrackingExpand = (orderId: string) => {
    setExpandedTrackingIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleConfirmReceived = async (order: OrderRecord) => {
    setIsSubmittingAction(order.id);
    try {
      const updated = await orderService.confirmOrderReceived(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o)),
      );
      toast.success(
        `Order #${order.orderCode} completed! Thank you for shopping with Flydigi.`,
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to confirm order receipt";
      toast.error(msg);
    } finally {
      setIsSubmittingAction(null);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelTarget) return;
    setIsSubmittingAction(cancelTarget.id);
    try {
      const updated = await orderService.cancelMyOrder(
        cancelTarget.id,
        selectedCancelReason,
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o)),
      );
      toast.success(`Order #${cancelTarget.orderCode} has been cancelled.`);
      setCancelTarget(null);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to cancel order";
      toast.error(msg);
    } finally {
      setIsSubmittingAction(null);
    }
  };

  const filteredOrders =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.orderStatus === activeTab);

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wide text-white">
            Purchase & COD Tracking ({orders.length})
          </h2>
          <p className="text-xs text-gray-400">
            Track your orders from confirmation, packing, carrier transit to
            doorstep delivery
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-brand hover:text-white"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Shopee-Style Order Status Tabs */}
      <div className="flex overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0b0f] p-1.5">
        {SHOPEE_TABS.map((tab) => {
          const count =
            tab.id === "ALL"
              ? orders.length
              : orders.filter((o) => o.orderStatus === tab.id).length;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-brand text-white shadow-lg shadow-brand/25"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    isActive
                      ? "bg-black/30 text-white"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b0b0f] p-12 text-center text-sm text-gray-400">
          Loading your orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b0b0f] p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-4 text-base font-bold uppercase text-white">
            No Orders in This Tab
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Explore our latest controllers and place an order with COD or
            VietQR.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
          >
            Shop Controllers
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const stepIndex = getStepIndex(order.orderStatus);
            const canPayQr =
              order.paymentMethod === "qr" &&
              order.paymentStatus === "unpaid" &&
              order.orderStatus !== "cancelled";
            const canCancel = order.orderStatus === "pending";
            const canConfirmReceived = order.orderStatus === "shipping";
            const isExpanded = Boolean(expandedTrackingIds[order.id]);
            const logs = Array.isArray(order.trackingLogs)
              ? [...order.trackingLogs].reverse()
              : [];

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f] p-5 sm:p-6"
              >
                {/* Top Bar: Order Code, Carrier Tracking & Status Headline */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-brand/15 px-2.5 py-1 font-mono text-xs font-black text-brand">
                      #{order.orderCode}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {order.shippingCarrier && order.trackingNumber && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-[11px] font-bold text-purple-300">
                        <Truck className="h-3.5 w-3.5" />
                        {order.shippingCarrier}: {order.trackingNumber}
                      </span>
                    )}
                  </div>

                  {/* Payment & Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {order.paymentMethod === "qr"
                        ? "VietQR • SePay"
                        : "COD (Pay on Delivery)"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {order.paymentStatus === "paid"
                        ? "Paid"
                        : order.paymentMethod === "cod"
                          ? `Collect ${formatVND(order.totalAmount)} on Delivery`
                          : "Unpaid"}
                    </span>
                  </div>
                </div>

                {/* Shopee 4-Step Visual Progress Stepper (For non-cancelled orders) */}
                {order.orderStatus !== "cancelled" ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-4">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {
                          step: 1,
                          label:
                            order.paymentMethod === "cod"
                              ? "Order Placed (COD)"
                              : "Order Placed",
                          sub: "Pending Confirmation",
                          icon: Clock,
                        },
                        {
                          step: 2,
                          label:
                            order.paymentMethod === "cod"
                              ? "Seller Confirmed"
                              : "Payment Verified",
                          sub: "Preparing Package",
                          icon: ShieldCheck,
                        },
                        {
                          step: 3,
                          label: "In Transit",
                          sub: order.shippingCarrier || "Delivering to You",
                          icon: Truck,
                        },
                        {
                          step: 4,
                          label: "Completed",
                          sub:
                            order.paymentMethod === "cod"
                              ? "Received & Paid COD"
                              : "Package Delivered",
                          icon: PackageCheck,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const reached = stepIndex >= item.step;
                        const isCurrent = stepIndex === item.step;

                        return (
                          <div
                            key={item.step}
                            className="flex flex-col items-center text-center"
                          >
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                                reached
                                  ? isCurrent
                                    ? "border-brand bg-brand text-white shadow-[0_0_15px_rgb(var(--color-brand)/0.5)]"
                                    : "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                                  : "border-white/10 bg-white/5 text-gray-500"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <p
                              className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${
                                reached ? "text-white" : "text-gray-500"
                              }`}
                            >
                              {item.label}
                            </p>
                            <p className="hidden text-[10px] text-gray-500 sm:block">
                              {item.sub}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>
                      <strong>Order Cancelled</strong>
                      {order.cancelReason ? ` — Reason: ${order.cancelReason}` : ""}
                    </span>
                  </div>
                )}

                {/* Ordered Products List */}
                <div className="mt-4 divide-y divide-white/5">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}-${item.productId}`}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-xl border border-white/10 bg-black object-contain p-1.5"
                        />
                        <div>
                          <Link
                            to={`/products/${encodeURIComponent(item.slug)}`}
                            className="text-xs font-bold uppercase text-white hover:text-brand sm:text-sm"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Qty: {item.quantity} × {formatVND(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white sm:text-sm">
                        {formatVND(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expandable Parcel Journey Timeline (Shopee Style) */}
                {logs.length > 0 && (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleTrackingExpand(order.id)}
                      className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2 text-xs text-gray-300 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-2 w-2 rounded-full bg-brand" />
                        <strong className="text-white">
                          {logs[0]?.title}:
                        </strong>
                        <span className="truncate text-gray-400">
                          {logs[0]?.description}
                        </span>
                      </span>
                      <span className="ml-2 inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand">
                        {isExpanded ? (
                          <>
                            <span>Hide Timeline</span>
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Tracking History ({logs.length})</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-black/60 p-4">
                        {logs.map((log, idx) => (
                          <div
                            key={`${log.timestamp}-${idx}`}
                            className="flex items-start gap-3 text-xs"
                          >
                            <div className="mt-1 flex flex-col items-center">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  idx === 0 ? "bg-brand" : "bg-gray-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={`font-bold ${
                                    idx === 0 ? "text-white" : "text-gray-400"
                                  }`}
                                >
                                  {log.title}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  {new Date(log.timestamp).toLocaleString(
                                    "en-US",
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    },
                                  )}
                                </span>
                              </div>
                              <p className="mt-0.5 text-gray-400">
                                {log.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Shipping Destination & Shopee Action Buttons */}
                <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-black/50 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-2.5 text-xs text-gray-300">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <p className="font-bold text-white">
                        Delivery Address: {order.shippingInfo.fullName} •{" "}
                        <span className="font-mono text-cyan-400">
                          {order.shippingInfo.phone}
                        </span>
                      </p>
                      <p className="mt-0.5 text-gray-400">
                        {order.shippingInfo.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <div className="mr-2 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Order Total
                      </p>
                      <p className="text-base font-black text-brand">
                        {formatVND(order.totalAmount)}
                      </p>
                    </div>

                    {/* Shopee Action 1: Pay QR */}
                    {canPayQr && (
                      <button
                        type="button"
                        onClick={() => setSelectedQrOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-brand/90"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Pay Now (QR)</span>
                      </button>
                    )}

                    {/* Shopee Action 2: "Order Received" (Đã nhận được hàng) */}
                    {canConfirmReceived && (
                      <button
                        type="button"
                        disabled={isSubmittingAction === order.id}
                        onClick={() => void handleConfirmReceived(order)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {isSubmittingAction === order.id
                            ? "Confirming..."
                            : "Order Received"}
                        </span>
                      </button>
                    )}

                    {/* Shopee Action 3: Cancel Order (Before Seller Packs) */}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(order);
                          setSelectedCancelReason(
                            CANCEL_REASONS[0] ?? "Cancelled by customer",
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-colors hover:border-red-500/40 hover:text-red-300"
                      >
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shopee-Style Cancel Order Reason Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0b0f] p-6 text-white shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-wide text-white">
              Cancel Order #{cancelTarget.orderCode}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Please select a reason for cancelling this order:
            </p>

            <div className="mt-4 space-y-2.5">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                    selectedCancelReason === reason
                      ? "border-brand bg-brand/15 text-white"
                      : "border-white/10 bg-black/50 text-gray-300 hover:border-white/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedCancelReason === reason}
                    onChange={() => setSelectedCancelReason(reason)}
                    className="text-brand focus:ring-brand"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-gray-300 hover:text-white"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isSubmittingAction === cancelTarget.id}
                onClick={() => void handleConfirmCancelOrder()}
                className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isSubmittingAction === cancelTarget.id
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Payment Modal */}
      <QrPaymentModal
        order={selectedQrOrder}
        open={Boolean(selectedQrOrder)}
        onClose={() => setSelectedQrOrder(null)}
        onOrderUpdated={(updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
          );
          setSelectedQrOrder(updated);
        }}
      />
    </div>
  );
}
