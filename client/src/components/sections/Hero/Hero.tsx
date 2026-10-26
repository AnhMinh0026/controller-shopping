import HeroShowcase from "./HeroShowcase";
import HeroScrollIndicator from "./HeroScrollIndicator";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 pb-24 pt-28">
      {/* VFX layer */}
      <img
        src="/images/backgrounds/studio-spotlight.png"
        alt="Studio Light"
        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen pointer-events-none z-0"
      />

      {/* Content layer */}
      <div className="relative z-10 flex w-full flex-col items-center">
        <HeroShowcase />
      </div>

      <HeroScrollIndicator />
    </section>
  );
}
