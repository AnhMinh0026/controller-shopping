import { useEffect } from "react";
import ProductCard from "../../components/common/ProductCard";
import { ScrollToTopButton } from "../../components/common/ScrollToTopButton";
import Header from "../../components/layout/Header/Header";
import { DEFAULT_PRODUCTS_LIMIT } from "../../services/product.service";
import { useProductStore } from "../../store/useProductStore";

const SKELETON_KEYS = Array.from(
  { length: DEFAULT_PRODUCTS_LIMIT },
  (_, index) => `product-skeleton-${index}`,
);

export default function ProductsPage() {
  const products = useProductStore((state) => state.products);
  const isLoading = useProductStore((state) => state.isLoading);
  const isFetchingNextPage = useProductStore(
    (state) => state.isFetchingNextPage,
  );
  const hasMore = useProductStore((state) => state.hasMore);
  const error = useProductStore((state) => state.error);
  const fetchInitialProducts = useProductStore(
    (state) => state.fetchInitialProducts,
  );
  const loadMoreProducts = useProductStore((state) => state.loadMoreProducts);

  useEffect(() => {
    void fetchInitialProducts();
  }, [fetchInitialProducts]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="mt-2 text-3xl font-black uppercase tracking-wide text-white sm:text-4xl md:text-5xl">
            ALL PRODUCTS
          </h1>
          <div className="mt-3 text-sm leading-relaxed text-gray-400">
            Engineered with Hall Effect sensors, force-adjustable triggers, and
            ultra-low latency wireless technology for competitive gaming.
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200 sm:flex-row sm:items-center"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                if (products.length === 0) {
                  void fetchInitialProducts();
                } else {
                  void loadMoreProducts();
                }
              }}
              className="rounded-full border border-red-400/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-100 transition-colors hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* Initial Skeleton Loader */}
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading products"
            className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4"
          >
            {SKELETON_KEYS.map((key) => (
              <ProductCardSkeleton key={key} />
            ))}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0f] py-20 text-center">
            <p className="text-sm uppercase tracking-widest text-gray-400">
              No products available at the moment.
            </p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Pagination */}
            {hasMore && (
              <div className="mt-14 flex justify-center">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  onClick={() => void loadMoreProducts()}
                  className="inline-flex min-w-[200px] items-center justify-center gap-3 rounded-full border border-[#cea15b] bg-transparent px-8 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-[#cea15b] transition-all duration-300 hover:bg-[#cea15b] hover:text-black hover:shadow-[0_0_25px_rgba(206,161,91,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#cea15b] disabled:hover:shadow-none"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Spinner />
                      <span>LOADING...</span>
                    </>
                  ) : (
                    <span>LOAD MORE</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <ScrollToTopButton />
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f]">
      <div className="aspect-square w-full animate-pulse bg-white/5" />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="h-2.5 w-20 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/15" />
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="h-5 w-16 animate-pulse rounded bg-white/15" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
        className="opacity-90"
      />
    </svg>
  );
}
