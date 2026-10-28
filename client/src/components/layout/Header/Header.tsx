import { Link } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import HeaderAuthActions from "./components/HeaderAuthActions";
import MobileNavMenu from "./components/MobileNavMenu";
import { useHeaderState } from "./hooks/useHeaderState";

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
  const { isScrolled, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useHeaderState();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

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
          <HeaderAuthActions
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={() => void logout()}
          />

          {/* Hamburger Button (< md) */}
          <button
            type="button"
            onClick={toggleMobileMenu}
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
      <MobileNavMenu
        isOpen={isMobileMenuOpen}
        navItems={NAV_ITEMS}
        isAuthenticated={isAuthenticated}
        user={user}
        onClose={closeMobileMenu}
        onLogout={() => void logout()}
      />
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
