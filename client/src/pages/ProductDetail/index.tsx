import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PriceTag from "../../components/common/PriceTag";
import { ScrollToTopButton } from "../../components/common/ScrollToTopButton";
import Header from "../../components/layout/Header/Header";
import {
  getProductBySlug,
  type Product,
} from "../../services/product.service";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Failed to load product details."
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    let isCancelled = false;

    const loadProduct = async () => {
      if (!slug) {
        if (!isCancelled) {
          setError("Product slug is missing.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getProductBySlug(slug);
        if (isCancelled) return;
        setProduct(data);
        setSelectedImage(data.images?.[0] || data.image);
        setQuantity(1);
        setIsLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        setError(getErrorMessage(err));
        setIsLoading(false);
      }
    };

    void loadProduct();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const gallery =
    product?.images && product.images.length > 0
      ? product.images
      : product
        ? [product.image]
        : [];

  const isOutOfStock = product?.inStock === false || product?.stock === 0;
  const maxStock =
    typeof product?.stock === "number" && product.stock > 0
      ? product.stock
      : 99;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-gray-400"
        >
          <Link to="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="transition-colors hover:text-white">
            Products
          </Link>
          {product && (
            <>
              <span>/</span>
              <span className="font-semibold text-brand">{product.name}</span>
            </>
          )}
        </nav>

        {isLoading ? (
          <ProductDetailSkeleton />
        ) : error || !product ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0f] px-6 py-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">
              PRODUCT UNAVAILABLE
            </p>
            <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-wide text-white sm:text-3xl">
              {error || "Product not found"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
              The controller you are looking for might have been moved or is no
              longer available.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand transition-all duration-300 hover:bg-brand hover:text-white"
            >
              Back to Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Image Gallery */}
            <div className="lg:col-span-7">
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f] p-8 sm:p-12">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgb(var(--color-brand) / 0.22) 0%, rgb(var(--color-brand) / 0.08) 45%, transparent 72%)",
                  }}
                />
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  decoding="async"
                  draggable={false}
                  className="relative z-10 h-full w-full select-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] transition-all duration-500"
                />
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {gallery.map((imgUrl, index) => {
                    const isSelected =
                      (selectedImage || product.image) === imgUrl;
                    return (
                      <button
                        key={`${imgUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(imgUrl)}
                        aria-label={`View image ${index + 1} of ${product.name}`}
                        className={`relative h-20 w-20 overflow-hidden rounded-xl border bg-[#0b0b0f] p-2 transition-all duration-200 sm:h-24 sm:w-24 ${
                          isSelected
                            ? "border-brand shadow-[0_0_15px_rgb(var(--color-brand)/0.35)]"
                            : "border-white/10 opacity-60 hover:border-white/30 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Product Info & Actions */}
            <div className="flex flex-col justify-between lg:col-span-5">
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
                      ? "Out of Stock"
                      : typeof product.stock === "number"
                        ? `In Stock (${product.stock} left)`
                        : "In Stock"}
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
                      Overview
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
                      Key Specifications & Features
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

              {/* Quantity & Purchase Controls */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center rounded-full border border-white/15 bg-[#0b0b0f]">
                    <button
                      type="button"
                      disabled={isOutOfStock || quantity <= 1}
                      onClick={() =>
                        setQuantity((prev) => Math.max(1, prev - 1))
                      }
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
                      onClick={() =>
                        setQuantity((prev) => Math.min(maxStock, prev + 1))
                      }
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
                    className="flex-1 rounded-full border border-brand bg-brand px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-transparent hover:text-brand hover:shadow-[0_0_25px_rgb(var(--color-brand)/0.45)] disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/5 disabled:text-gray-500 disabled:hover:shadow-none"
                  >
                    {isOutOfStock ? "Sold Out" : "Add to Cart"}
                  </button>
                </div>

                {/* Back Link */}
                <div className="mt-6">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
                  >
                    <span>←</span>
                    <span>Back to All Products</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ScrollToTopButton />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product details"
      className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12"
    >
      <div className="lg:col-span-7">
        <div className="aspect-square w-full animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      </div>
      <div className="flex flex-col justify-between lg:col-span-5">
        <div>
          <div className="h-6 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-10 w-3/4 animate-pulse rounded-lg bg-white/15" />
          <div className="mt-5 h-9 w-32 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-8 space-y-2.5">
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
          </div>
          <div className="mt-8 space-y-2.5">
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="mt-8 flex gap-4 border-t border-white/10 pt-6">
          <div className="h-12 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="h-12 flex-1 animate-pulse rounded-full bg-white/15" />
        </div>
      </div>
    </div>
  );
}
