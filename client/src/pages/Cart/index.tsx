import {
  ArrowRight,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header/Header";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { formatVND } from "../../utils/formatCurrency";

export default function CartPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400"
        >
          <Link to="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-brand">Shopping Cart</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">
              YOUR GEAR SELECTION
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
              Shopping Cart ({totalItems})
            </h1>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:border-red-500/40 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-[#0b0b0f] px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold uppercase tracking-wide text-white">
              Your Cart Is Empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              Explore our pro-grade controllers and add your favorite gear to
              the cart.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-brand/90"
            >
              <span>Browse Controllers</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Cart Items List */}
            <div className="space-y-4 lg:col-span-8">
              {items.map(({ product, quantity }) => {
                const maxStock =
                  typeof product.stock === "number" ? product.stock : 99;
                const detailPath = `/products/${encodeURIComponent(
                  product.slug || product.id,
                )}`;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0b0f] p-4 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        to={detailPath}
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black p-2"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      </Link>
                      <div>
                        <Link
                          to={detailPath}
                          className="text-base font-bold uppercase tracking-wide text-white transition-colors hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs font-semibold text-brand">
                          {formatVND(product.price)}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          Available Stock: {maxStock} units
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
                      {/* Quantity Control */}
                      <div className="flex items-center rounded-full border border-white/15 bg-black">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(product.id, quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="h-9 w-9 text-sm font-bold text-white/80 transition-colors hover:text-brand"
                        >
                          −
                        </button>
                        <span className="min-w-[2.2rem] text-center text-xs font-bold text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= maxStock}
                          onClick={() =>
                            updateQuantity(product.id, quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="h-9 w-9 text-sm font-bold text-white/80 transition-colors hover:text-brand disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Subtotal */}
                      <div className="min-w-[110px] text-right">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">
                          Subtotal
                        </p>
                        <p className="text-sm font-black text-white">
                          {formatVND(product.price * quantity)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 rounded-3xl border border-white/10 bg-[#0b0b0f] p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Items ({totalItems})</span>
                    <span className="font-semibold text-white">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-400">
                      Free Express Delivery
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Total Amount
                  </span>
                  <span className="text-2xl font-black text-brand">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-brand/90 hover:shadow-[0_0_25px_rgb(var(--color-brand)/0.45)]"
                >
                  <span>
                    {isAuthenticated
                      ? "Proceed to Checkout"
                      : "Sign In to Checkout"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Supported Payment Highlights */}
                <div className="mt-6 space-y-2.5 rounded-2xl border border-white/10 bg-black/50 p-4 text-[11px] text-gray-400">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-4 w-4 shrink-0 text-brand" />
                    <span>
                      Instant <strong className="text-white">VietQR</strong> &{" "}
                      <strong className="text-white">Bank Transfer</strong>{" "}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      Supports{" "}
                      <strong className="text-white">
                        Cash on Delivery (COD)
                      </strong>{" "}
                      nationwide
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Official 12-Month Flydigi Hardware Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
