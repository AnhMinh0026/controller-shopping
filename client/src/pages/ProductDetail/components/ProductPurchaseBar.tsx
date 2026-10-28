interface ProductPurchaseBarProps {
  quantity: number;
  maxStock: number;
  isOutOfStock: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export default function ProductPurchaseBar({
  quantity,
  maxStock,
  isOutOfStock,
  onDecrease,
  onIncrease,
}: ProductPurchaseBarProps) {
  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center rounded-full border border-white/15 bg-[#0b0b0f]">
          <button
            type="button"
            disabled={isOutOfStock || quantity <= 1}
            onClick={onDecrease}
            aria-label="Giảm số lượng"
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
            aria-label="Tăng số lượng"
            className="h-11 w-11 text-base font-bold text-white/80 transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => {
            alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng (Chức năng Demo).`);
          }}
          className="flex-1 rounded-full border border-brand bg-brand py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-transparent hover:text-brand hover:shadow-[0_0_25px_rgb(var(--color-brand)/0.45)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-gray-500 disabled:shadow-none sm:py-4"
        >
          {isOutOfStock ? "Tạm Hết Hàng" : "Thêm Vào Giỏ Hàng"}
        </button>
      </div>
    </div>
  );
}

