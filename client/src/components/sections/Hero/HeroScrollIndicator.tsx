export default function HeroScrollIndicator() {
  return (
    <a
      href="#features"
      aria-label="Scroll to explore"
      className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white"
    >
      <span className="text-xs tracking-widest">SCROLL TO EXPLORE</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 animate-bounce"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12l7 7 7-7" />
      </svg>
    </a>
  );
}
