interface BentoCardProps {
  title: string;
  imageSrc: string;
  /** Grid placement classes, e.g. `md:col-span-6`. */
  className?: string;
  /** Tailwind text color class for the title; override on light backgrounds. */
  titleColor?: string;
}

export default function BentoCard({
  title,
  imageSrc,
  className = "",
  titleColor = "text-white",
}: BentoCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-[#111] ${className}`}
    >
      <h3
        className={`absolute left-6 top-6 z-10 text-xs font-bold uppercase tracking-widest sm:text-sm ${titleColor}`}
      >
        {title}
      </h3>
      <img
        src={imageSrc}
        alt=""
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
      />
    </article>
  );
}

