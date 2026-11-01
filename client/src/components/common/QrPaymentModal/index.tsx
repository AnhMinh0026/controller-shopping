import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  orderService,
  type OrderRecord,
} from "../../../services/order.service";
import { formatVND } from "../../../utils/formatCurrency";

interface QrPaymentModalProps {
  order: OrderRecord | null;
  open: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: OrderRecord) => void;
}

export default function QrPaymentModal({
  order,
  open,
  onClose,
  onOrderUpdated,
}: QrPaymentModalProps) {
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeOrder =
    latestOrder && order && latestOrder.id === order.id ? latestOrder : order;
  const isPaid = activeOrder?.paymentStatus === "paid";
  const instructions = activeOrder?.paymentInstructions;

  // Poll SePay payment status every 4 seconds while modal is open and unpaid
  useEffect(() => {
    if (!open || !activeOrder || isPaid || activeOrder.paymentMethod !== "qr") {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const result = await orderService.checkOrderPayment(activeOrder.id);
        if (result.paid) {
          setLatestOrder(result.order);
          onOrderUpdated?.(result.order);
          toast.success(
            `Payment for order ${result.order.orderCode} verified via SePay!`,
          );
        }
      } catch {
        // Silent background polling
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [open, activeOrder, isPaid, onOrderUpdated]);

  if (!open || !activeOrder) return null;

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const result = await orderService.checkOrderPayment(activeOrder.id);
      setLatestOrder(result.order);
      onOrderUpdated?.(result.order);
      if (result.paid) {
        toast.success("Payment verified! Your order is now being processed.");
      } else {
        toast.info(
          "Transaction not detected yet. The system will auto-confirm as soon as SePay receives your transfer.",
        );
      }
    } catch {
      toast.error("Unable to check payment status right now.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      toast.success(`Copied ${label}`);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0b0b0f] p-6 text-white shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close payment window"
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:border-white/30 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/15 text-brand">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand">
              SEPAY AUTO-VERIFICATION GATEWAY
            </p>
            <h2 className="text-lg font-black uppercase tracking-wide text-white sm:text-xl">
              Order #{activeOrder.orderCode}
            </h2>
          </div>
        </div>

        {isPaid ? (
          /* Paid / Confirmed State */
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
            <h3 className="mt-3 text-xl font-black uppercase tracking-wide text-white">
              Payment Verified!
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-300">
              SePay has confirmed your transfer of{" "}
              <span className="font-bold text-emerald-300">
                {formatVND(activeOrder.totalAmount)}
              </span>
              . Your order is now being prepared for shipment to:
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-4 text-left text-xs text-gray-300">
              <p className="font-bold text-white">
                {activeOrder.shippingInfo.fullName} •{" "}
                {activeOrder.shippingInfo.phone}
              </p>
              <p className="mt-1 text-gray-400">
                {activeOrder.shippingInfo.address}
              </p>
              {activeOrder.sepayTransaction?.referenceCode && (
                <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-emerald-400">
                  Transaction Ref: {activeOrder.sepayTransaction.referenceCode}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-brand/90"
            >
              Done & View Order Status
            </button>
          </div>
        ) : (
          /* Unpaid QR + Bank Transfer Details State */
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Left: VietQR / SePay QR Code */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-5 md:col-span-5">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                <QrCode className="h-3.5 w-3.5" />
                Method 1: Scan VietQR
              </span>

              {instructions?.qrUrl ? (
                <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-lg">
                  <img
                    src={instructions.qrUrl}
                    alt={`VietQR for Order ${activeOrder.orderCode}`}
                    className="h-48 w-48 object-contain sm:h-52 sm:w-52"
                  />
                </div>
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs text-gray-400">
                  QR Code Unavailable
                </div>
              )}

              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-400">
                Open any Banking App or MoMo/ZaloPay and scan this QR code for
                instant pre-filled transfer.
              </p>
            </div>

            {/* Right: Manual Transfer / Top-Up Details */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/60 p-5 md:col-span-7">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-200">
                  <CreditCard className="h-3.5 w-3.5 text-brand" />
                  Method 2: Manual Bank Transfer Info
                </span>

                <div className="mt-4 space-y-3">
                  {/* Bank Name */}
                  <div className="rounded-xl border border-white/10 bg-[#0b0b0f] px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Bank Name
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      {instructions?.bankCode || "MBBank"}
                    </p>
                  </div>

                  {/* Account Holder */}
                  <div className="rounded-xl border border-white/10 bg-[#0b0b0f] px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Account Holder
                    </p>
                    <p className="mt-0.5 text-sm font-bold uppercase text-white">
                      {instructions?.accountName || "FLYDIGI VIETNAM OFFICIAL"}
                    </p>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0b0f] px-3.5 py-2.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Account Number
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-white">
                        {instructions?.accountNumber || "091234567899"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          instructions?.accountNumber || "091234567899",
                          "Account Number",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition-colors hover:border-brand hover:text-white"
                    >
                      {copiedField === "Account Number" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0b0f] px-3.5 py-2.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Exact Amount
                      </p>
                      <p className="mt-0.5 text-base font-black text-brand">
                        {formatVND(activeOrder.totalAmount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          String(activeOrder.totalAmount),
                          "Amount",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition-colors hover:border-brand hover:text-white"
                    >
                      {copiedField === "Amount" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  {/* Transfer Content / Memo */}
                  <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Transfer Content / Memo (Required)
                      </p>
                      <p className="mt-0.5 font-mono text-base font-black tracking-wider text-white">
                        {activeOrder.orderCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          activeOrder.orderCode,
                          "Transfer Content",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-400/30"
                    >
                      {copiedField === "Transfer Content" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status & Check Button */}
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                    Listening for SePay transaction...
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Auto-Check Active
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isChecking}
                    onClick={() => void handleManualCheck()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isChecking
                        ? "Checking SePay..."
                        : "I Have Transferred • Check Now"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
