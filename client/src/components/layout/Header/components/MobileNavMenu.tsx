import { Link } from "react-router-dom";
import type { AuthUser } from "../../../../services/auth.service";

interface NavItem {
  label: string;
  to: string;
}

interface MobileNavMenuProps {
  isOpen: boolean;
  navItems: readonly NavItem[];
  isAuthenticated: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onLogout: () => void;
}

export default function MobileNavMenu({
  isOpen,
  navItems,
  isAuthenticated,
  user,
  onClose,
  onLogout,
}: MobileNavMenuProps) {
  return (
    <div
      id="mobile-navigation"
      className={`grid overflow-hidden transition-all duration-300 ease-out md:hidden ${
        isOpen
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
            {navItems.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className="block rounded-lg px-3 py-2.5 text-xs font-medium uppercase tracking-widest text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth buttons inside mobile menu on extra-small screens (< sm) */}
          {isAuthenticated && user ? (
            <div className="mt-3 flex flex-col gap-2.5 border-t border-white/10 pt-3 sm:hidden">
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-full border border-brand bg-brand/20 py-2 text-xs font-bold uppercase tracking-widest text-white"
                >
                  Admin Panel
                </Link>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {user.name}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-300"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-3 sm:hidden">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center rounded-full border border-white/20 py-2 text-xs font-semibold uppercase tracking-widest text-white/90 transition-colors hover:border-white hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="flex items-center justify-center rounded-full border border-brand bg-brand py-2 text-xs font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-transparent hover:text-brand"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}

