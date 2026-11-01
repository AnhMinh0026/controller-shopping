import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Truck,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import QrPaymentModal from "../../components/common/QrPaymentModal";
import Header from "../../components/layout/Header/Header";
import {
  orderService,
  type OrderRecord,
} from "../../services/order.service";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { formatVND } from "../../utils/formatCurrency";

const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Recipient full name must be at least 2 characters")
    .max(80, "Recipient name cannot exceed 80 characters"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+?84|0)[35789]\d{8}$/,
      "Please enter a valid Vietnamese phone number (e.g. 0912345678)",
    ),
  address: z
    .string()
    .trim()
    .min(5, "Please enter a complete delivery address")
    .max(500, "Delivery address cannot exceed 500 characters"),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["qr", "cod"]),
  saveToProfile: z.boolean(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [createdQrOrder, setCreatedQrOrder] = useState<OrderRecord | null>(
    null,
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      note: "",
      paymentMethod: "qr",
      saveToProfile: true,
    },
  });

  useEffect(() => {
    if (user) {
      reset((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
      }));
    }
  }, [user, reset]);

  const selectedPaymentMethod = useWatch({
    control,
    name: "paymentMethod",
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const onSubmit = async (values: CheckoutFormValues) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      const order = await orderService.createOrder({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        shippingInfo: {
          fullName: values.fullName,
          phone: values.phone,
          address: values.address,
          note: values.note,
        },
        paymentMethod: values.paymentMethod,
        saveToProfile: values.saveToProfile,
      });

      clearCart();
      if (values.saveToProfile) {
        void refreshUser();
      }

      if (values.paymentMethod === "qr") {
        setCreatedQrOrder(order);
        setIsQrModalOpen(true);
        toast.success(
          `Order #${order.orderCode} created! Scan the QR code or transfer to complete payment.`,
        );
      } else {
        toast.success(
          `Order #${order.orderCode} placed via COD! We will ship to your address soon.`,
        );
        navigate("/profile?tab=orders");
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "Failed to place order";
      toast.error(errMsg);
    }
  };

  if (items.length === 0 && !createdQrOrder) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="mx-auto max-w-4xl px-4 pb-24 pt-32 text-center sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0f] p-12">
            <h1 className="text-2xl font-black uppercase tracking-wide text-white">
              No Items to Checkout
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Please add controllers to your cart before proceeding to checkout.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Browse Products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Cart</span>
        </Link>

        <div className="mt-4 border-b border-white/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">
            SECURE ORDER CHECKOUT
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
            Shipping & Payment
          </h1>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12"
        >
          {/* Left Column: Shipping Info & Payment Method */}
          <div className="space-y-6 lg:col-span-7">
            {/* Step 1: Shipping Address & Contact */}
            <div className="rounded-3xl border border-white/10 bg-[#0b0b0f] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide text-white">
                      1. Delivery Information
                    </h2>
                    <p className="text-xs text-gray-400">
                      Where should Admin ship your Flydigi order?
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Manage in Profile →
                </Link>
              </div>

              {(!user?.phone || !user?.address) && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                  Your profile does not have a saved phone number or shipping
                  address yet. Fill them in below and we will automatically save
                  them to your profile!
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Recipient Name */}
                  <div>
                    <label
                      htmlFor="checkout-fullname"
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-brand" />
                      <span>Recipient Full Name</span>
                    </label>
                    <input
                      id="checkout-fullname"
                      type="text"
                      placeholder="John Doe"
                      {...register("fullName")}
                      className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300"
                    >
                      <Phone className="h-3.5 w-3.5 text-brand" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      placeholder="0912345678"
                      {...register("phone")}
                      className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Full Shipping Address */}
                <div>
                  <label
                    htmlFor="checkout-address"
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300"
                  >
                    <MapPin className="h-3.5 w-3.5 text-brand" />
                    <span>Detailed Shipping Address</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={3}
                    placeholder="House number, street name, ward/commune, district, province/city..."
                    {...register("address")}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Order Note */}
                <div>
                  <label
                    htmlFor="checkout-note"
                    className="block text-[11px] font-bold uppercase tracking-widest text-gray-300"
                  >
                    Delivery Note (Optional)
                  </label>
                  <input
                    id="checkout-note"
                    type="text"
                    placeholder="E.g. Deliver during office hours, call before arriving..."
                    {...register("note")}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
                  />
                </div>

                {/* Save to Profile Checkbox */}
                <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    {...register("saveToProfile")}
                    className="h-4 w-4 rounded border-white/20 bg-black text-brand focus:ring-brand"
                  />
                  <span>
                    Save this phone number and shipping address to my Customer
                    Profile
                  </span>
                </label>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="rounded-3xl border border-white/10 bg-[#0b0b0f] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide text-white">
                    2. Payment Method
                  </h2>
                  <p className="text-xs text-gray-400">
                    Choose VietQR / Bank Transfer (SePay Auto-Verification) or
                    COD
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Option 1: VietQR / SePay */}
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "qr")}
                  className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                    selectedPaymentMethod === "qr"
                      ? "border-brand bg-brand/15 shadow-[0_0_25px_rgb(var(--color-brand)/0.25)]"
                      : "border-white/10 bg-black/50 hover:border-white/25"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20 text-brand">
                        <QrCode className="h-5 w-5" />
                      </span>
                      {selectedPaymentMethod === "qr" && (
                        <CheckCircle2 className="h-5 w-5 text-brand" />
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-white">
                      QR Code & Bank Transfer
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                      Scan dynamic VietQR or transfer via bank account details.
                      Automatically verified by{" "}
                      <strong className="text-white">SePay</strong>.
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Instant Auto-Confirmation</span>
                  </div>
                </button>

                {/* Option 2: COD */}
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "cod")}
                  className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                    selectedPaymentMethod === "cod"
                      ? "border-brand bg-brand/15 shadow-[0_0_25px_rgb(var(--color-brand)/0.25)]"
                      : "border-white/10 bg-black/50 hover:border-white/25"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Truck className="h-5 w-5" />
                      </span>
                      {selectedPaymentMethod === "cod" && (
                        <CheckCircle2 className="h-5 w-5 text-brand" />
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-white">
                      Cash on Delivery (COD)
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                      Inspect your package and pay in cash directly to the
                      courier upon delivery to your address.
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    <Truck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Pay Upon Receipt</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-[#0b0b0f] p-6 sm:p-8">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                Order Summary ({totalItems} items)
              </h2>

              <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg border border-white/10 bg-black object-contain p-1"
                      />
                      <div>
                        <p className="line-clamp-1 text-xs font-bold uppercase text-white">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Qty: {quantity} × {formatVND(product.price)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">
                      {formatVND(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2.5 border-t border-white/10 pt-4 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">
                    {formatVND(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Payment Method</span>
                  <span className="font-bold uppercase text-brand">
                    {selectedPaymentMethod === "qr"
                      ? "VietQR / Bank Transfer (SePay)"
                      : "Cash on Delivery (COD)"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Total Payment
                </span>
                <span className="text-2xl font-black text-brand">
                  {formatVND(totalAmount)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-brand/90 hover:shadow-[0_0_25px_rgb(var(--color-brand)/0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing Order..."
                  : selectedPaymentMethod === "qr"
                    ? "Place Order & Generate QR Code"
                    : "Place Order (COD)"}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* SePay QR & Bank Transfer Modal */}
      <QrPaymentModal
        order={createdQrOrder}
        open={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          navigate("/profile?tab=orders");
        }}
        onOrderUpdated={(updated) => setCreatedQrOrder(updated)}
      />
    </div>
  );
}

