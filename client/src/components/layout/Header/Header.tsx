import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Products", to: "/products" },
  { label: "Support", to: "/#support" },
  { label: "About Us", to: "/#about" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMobileMenuOpen(false);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "border-b border-white/10 bg-black/85 py-3 shadow-lg shadow-black/50 backdrop-blur-md md:py-3.5"
          : "border-b border-transparent bg-transparent py-4 md:py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          aria-label="Flydigi home"
          className="flex shrink-0 items-center"
        >
          <img
            src="/images/logos/Flydigilogo.avif"
            alt="Flydigi"
            className="h-7 w-auto object-contain sm:h-8 md:h-9 lg:h-10"
          />
        </Link>

        {/* Desktop & Tablet Navigation */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-6 lg:gap-10 xl:gap-12">
            {NAV_ITEMS.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-xs font-medium uppercase tracking-widest text-white/80 transition-colors hover:text-white lg:text-[13px]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth Actions & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <a
            href="#login"
            className="hidden px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:text-white sm:inline-block lg:px-3 lg:py-2"
          >
            Login
          </a>
          <a
            href="#signup"
            className="hidden rounded-full border border-brand bg-brand px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-transparent hover:text-brand sm:inline-block md:px-5 md:py-2 md:text-xs"
          >
            Sign Up
          </a>

          {/* Hamburger Button (< md) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/85 transition-colors hover:border-brand hover:text-brand md:hidden"
          >
            <MenuIcon isOpen={isMobileMenuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Panel (< md) */}
      <div
        id="mobile-navigation"
        className={`grid overflow-hidden transition-all duration-300 ease-out md:hidden ${
          isMobileMenuOpen
            ? "grid-rows-[1fr] border-t border-white/10 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 pb-5 pt-3 sm:px-6"
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={closeMobileMenu}
                    className="block rounded-lg px-3 py-2.5 text-xs font-medium uppercase tracking-widest text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth buttons inside mobile menu on extra-small screens (< sm) */}
            <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-3 sm:hidden">
              <a
                href="#login"
                onClick={closeMobileMenu}
                className="flex items-center justify-center rounded-full border border-white/20 py-2 text-xs font-semibold uppercase tracking-widest text-white/90 transition-colors hover:border-white hover:text-white"
              >
                Login
              </a>
              <a
                href="#signup"
                onClick={closeMobileMenu}
                className="flex items-center justify-center rounded-full border border-brand bg-brand py-2 text-xs font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-transparent hover:text-brand"
              >
                Sign Up
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isOpen ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}
