import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "../../services/auth.service";
import { useAuthStore } from "../../store/useAuthStore";
import Header from "../layout/Header/Header";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Wait for silent session refresh on initial page load
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to /login and preserve target location
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role check (RBAC: "admin" vs "customer")
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 pt-20 text-center">
          <div className="rounded-3xl border border-red-500/30 bg-[#0b0b0f] p-8 shadow-2xl sm:p-10">
            <span className="inline-block rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-red-400">
              403 FORBIDDEN
            </span>
            <h1 className="mt-4 text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
              Không đủ quyền truy cập
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Tài khoản của bạn hiện đang có vai trò{" "}
              <strong className="uppercase text-white">{user.role}</strong>. Khu
              vực này chỉ dành cho{" "}
              <strong className="uppercase text-brand">
                {allowedRoles.join(" / ")}
              </strong>
              .
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="rounded-full border border-brand bg-brand px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-transparent hover:text-brand"
              >
                Về Trang Chủ
              </Link>
              <Link
                to="/products"
                className="rounded-full border border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white/80 transition-colors hover:border-white hover:text-white"
              >
                Xem Sản Phẩm
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
