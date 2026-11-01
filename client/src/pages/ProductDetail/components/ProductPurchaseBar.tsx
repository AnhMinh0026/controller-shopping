import { ShoppingBag, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../../services/product.service";
import { useCartStore } from "../../../store/useCartStore";

interface ProductPurchaseBarProps {
  product: Product;
  quantity: number;
  maxStock: number;
  isOutOfStock: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export default function ProductPurchaseBar({
  product,
  quantity,
  maxStock,
  isOutOfStock,
  onDecrease,
  onIncrease,
}: ProductPurchaseBarProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate("/checkout");
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center rounded-full border border-white/15 bg-[#0b0b0f]">
          <button
            type="button"
            disabled={isOutOfStock || quantity <= 1}
            onClick={onDecrease}
            aria-label="Decrease quantity"
            className="h-11 w-11 text-base font-bold text-white/80 transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
            {quantity}
          </span>
          <button
            type="button"
            disabled={isOutOfStock || quantity >= maxStock}
            onClick={onIncrease}
            aria-label="Increase quantity"
            className="h-11 w-11 text-base font-bold text-white/80 transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-brand bg-brand/15 px-5 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-brand hover:shadow-[0_0_25px_rgb(var(--color-brand)/0.45)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-gray-500 disabled:shadow-none sm:py-4"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
        </button>

        {/* Buy Now Button */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex items-center justify-center gap-2 rounded-full border border-brand bg-brand px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-transparent hover:text-brand hover:shadow-[0_0_25px_rgb(var(--color-brand)/0.45)] sm:py-4"
          >
            <Zap className="h-4 w-4" />
            <span>Buy Now</span>
          </button>
        )}
      </div>
    </div>
  );
}
