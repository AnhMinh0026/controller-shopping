import type { HeroProduct } from "./heroProducts";

interface CarouselControlsProps {
  products: readonly HeroProduct[];
  activeIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

/** Previous / next arrows with progress bars between them. */
export default function CarouselControls({
  products,
  activeIndex,
  onPrevious,
  onNext,
  onSelect,
}: CarouselControlsProps) {
  return (
    <div className="mt-2 flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Previous product"
        className="text-brand/60 transition-colors hover:text-brand"
      >
        <Chevron direction="left" />
      </button>

      <div className="flex items-center gap-2">
        {products.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Go to ${product.name}`}
            className={`h-[3px] rounded-full bg-brand transition-all duration-700 ease-out ${
              index === activeIndex ? "w-8 opacity-100" : "w-3 opacity-30"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label="Next product"
        className="text-brand/60 transition-colors hover:text-brand"
      >
        <Chevron direction="right" />
      </button>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

