import CarouselControls from "./CarouselControls";
import ProductCaption from "./ProductCaption";
import ProductSlide from "./ProductSlide";
import { HERO_PRODUCTS } from "./heroProducts";
import { useOrbitCarousel } from "./useOrbitCarousel";

/** Orbiting product carousel: stage, caption and controls. */
export default function HeroShowcase() {
  const { current, settled, setPaused, goTo, step, registerSlide } =
    useOrbitCarousel(HERO_PRODUCTS.length);

  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-5xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[240px] w-full sm:h-[320px] md:h-[400px]">
        {HERO_PRODUCTS.map((product, index) => (
          <ProductSlide
            key={product.id}
            product={product}
            isActive={index === current}
            isBreathing={index === current && settled}
            slideRef={registerSlide(index)}
            onSelect={() => goTo(index)}
          />
        ))}
      </div>

      <ProductCaption products={HERO_PRODUCTS} activeIndex={current} />

      <CarouselControls
        products={HERO_PRODUCTS}
        activeIndex={current}
        onPrevious={() => step(-1)}
        onNext={() => step(1)}
        onSelect={goTo}
      />
    </div>
  );
}
