import type { HeroProduct } from "./heroProducts";

interface ProductCaptionProps {
  products: readonly HeroProduct[];
  activeIndex: number;
}

/** Product name + tagline; the captions are stacked and cross-fade. */
export default function ProductCaption({
  products,
  activeIndex,
}: ProductCaptionProps) {
  return (
    <div className="relative mt-4 h-24 text-center" aria-live="polite">
      {products.map((product, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={product.id}
            aria-hidden={!isActive}
            className={`absolute inset-x-0 top-0 transition-all duration-1000 ease-out motion-reduce:transition-none ${
              isActive ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="mt-6">
              <p className="text-xl font-bold tracking-[0.3em] text-white uppercase sm:text-2xl md:text-3xl">
                {product.name}
              </p>
              <p className="mt-1 text-xs tracking-widest text-white">
                {product.tagline}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

