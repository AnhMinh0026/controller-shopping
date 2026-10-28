import PriceTag from "../../../components/common/PriceTag";
import type { Product } from "../../../services/product.service";

interface ProductInfoProps {
  product: Product;
  isOutOfStock: boolean;
}

export default function ProductInfo({ product, isOutOfStock }: ProductInfoProps) {
  return (
    <div>
      {/* Status & Category */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
            isOutOfStock
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOutOfStock ? "bg-red-400" : "bg-emerald-400"
            }`}
          />
          {isOutOfStock
            ? "Hết Hàng"
            : typeof product.stock === "number"
              ? `Còn ${product.stock} sản phẩm`
              : "Còn Hàng"}
        </span>

        {product.category && (
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand">
            {product.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mt-4 text-3xl font-black uppercase tracking-wide text-white sm:text-4xl lg:text-5xl">
        {product.name}
      </h1>

      {/* Price */}
      <div className="mt-5 border-b border-white/10 pb-6">
        <PriceTag
          price={product.price}
          originalPrice={product.originalPrice}
          size="lg"
        />
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
            Tổng quan sản phẩm
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-gray-300 sm:text-base">
            {product.description}
          </p>
        </div>
      )}

      {/* Key Features */}
      {product.features && product.features.length > 0 && (
        <div className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
            Thông số & Tính năng nổi bật
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {product.features.map((feature, index) => (
              <li
                key={`${feature}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0b0b0f] px-4 py-3 text-xs font-medium text-gray-200 sm:text-sm"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

