import type { Ref } from "react";
import type { HeroProduct } from "./heroProducts";

interface ProductSlideProps {
  product: HeroProduct;
  isActive: boolean;
  /** When true, plays the one-shot glow breath (set after the orbit has stopped). */
  isBreathing: boolean;
  onSelect: () => void;
  /** Receives the DOM node so the carousel can drive its transform imperatively (per frame). */
  slideRef: Ref<HTMLButtonElement>;
}

const REST_GLOW =
  "drop-shadow(0 0 16px rgb(var(--color-brand) / calc(var(--glow, 1) * 0.25)))";

/**
 * A single orbiting product. Position, scale, opacity and glow are written by
 * the parent carousel on every animation frame, so no animated styles live here.
 */
export default function ProductSlide({
  product,
  isActive,
  isBreathing,
  onSelect,
  slideRef,
}: ProductSlideProps) {
  return (
    <button
      ref={slideRef}
      type="button"
      onClick={onSelect}
      tabIndex={isActive ? -1 : 0}
      aria-label={`Show ${product.name}`}
      aria-current={isActive}
      className={`absolute left-1/2 top-1/2 w-[62%] will-change-transform ${
        isActive ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <img
        src={product.image}
        alt={product.name}
        draggable={false}
        // Resting glow; the `breathe` animation starts and ends at this same value.
        style={{ filter: REST_GLOW }}
        className={`w-full select-none object-contain ${
          isBreathing ? "animate-breathe motion-reduce:animate-none" : ""
        }`}
      />
    </button>
  );
}
