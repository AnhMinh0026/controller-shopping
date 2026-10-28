import { Link } from "react-router-dom";
import type { AuthUser } from "../../../../services/auth.service";

interface HeaderAuthActionsProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
  onLogout: () => void;
}

export default function HeaderAuthActions({
  isAuthenticated,
  user,
  onLogout,
}: HeaderAuthActionsProps) {
  if (isAuthenticated && user) {
    return (
      <div className="hidden items-center gap-3 sm:flex">
        {user.role === "admin" && (
          <Link
            to="/admin"
            className="rounded-full border border-brand bg-brand/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-brand"
          >
            Admin Panel
          </Link>
        )}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold uppercase text-white">
            {user.name.charAt(0)}
          </span>
          <span className="max-w-[120px] truncate text-xs font-semibold text-white">
            {user.name}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              user.role === "admin"
                ? "bg-brand text-white"
                : "bg-white/10 text-gray-300"
            }`}
          >
            {user.role}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80 transition-colors hover:border-red-400 hover:text-red-300 md:text-xs"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <Link
        to="/login"
        className="hidden px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:text-white sm:inline-block lg:px-3 lg:py-2"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="hidden rounded-full border border-brand bg-brand px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-transparent hover:text-brand sm:inline-block md:px-5 md:py-2 md:text-xs"
      >
        Sign Up
      </Link>
    </>
  );
}

