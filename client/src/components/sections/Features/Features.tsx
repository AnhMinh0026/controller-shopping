import BentoCard from "./BentoCard";
import SectionIntro from "./SectionIntro";
import { FEATURES } from "./featuresData";

export default function Features() {
  return (
    <section id="features" className="bg-black px-6 pb-24">
      <SectionIntro />
      <div className="mx-auto max-w-7xl">
        <div className="grid auto-rows-[300px] grid-cols-1 gap-4 md:grid-cols-12">
          {FEATURES.map(({ id, title, imageSrc, className, titleColor }) => (
            <BentoCard
              key={id}
              title={title}
              imageSrc={imageSrc}
              className={className}
              titleColor={titleColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
