import { Link } from "react-router-dom";
import type { Product } from "../../../services/product.service";
import PriceTag from "../PriceTag";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const isOutOfStock = product.inStock === false;
  const detailPath = `/products/${encodeURIComponent(product.slug || product.id)}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f] transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_12px_35px_-10px_rgb(var(--color-brand)/0.25)]">
      {/* Badge */}
      {product.badge && (
        <span className="absolute left-4 top-4 z-10 rounded-full border border-[#cea15b]/40 bg-black/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#cea15b] backdrop-blur-sm">
          {product.badge}
        </span>
      )}

      {/* Image Wrapper */}
      <Link
        to={detailPath}
        aria-label={`View ${product.name}`}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent p-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at center, rgb(var(--color-brand) / 0.15) 0%, transparent 70%)",
          }}
        />
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="relative z-10 h-full w-full select-none object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {product.category && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
              {product.category}
            </p>
          )}
          <Link to={detailPath}>
            <h3 className="mt-1 line-clamp-1 text-base font-bold uppercase tracking-wide text-white transition-colors group-hover:text-brand">
              {product.name}
            </h3>
          </Link>
          {product.tagline && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
              {product.tagline}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <PriceTag
            price={product.price}
            originalPrice={product.originalPrice}
            size="md"
          />

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart?.(product)}
            className="rounded-full border border-brand bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-brand transition-all duration-300 hover:bg-brand hover:text-white hover:shadow-[0_0_20px_rgb(var(--color-brand)/0.45)] disabled:cursor-not-allowed disabled:border-white/15 disabled:text-gray-500 disabled:hover:bg-transparent disabled:hover:shadow-none"
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
