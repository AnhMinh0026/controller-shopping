import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";

export type AdminViewType = "overview" | "products" | "users" | "orders";

interface AdminSidebarProps {
  currentView: AdminViewType;
  onSelectView: (view: AdminViewType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
}: AdminSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: "products" as const,
      label: "Products",
      icon: Boxes,
      badge: undefined,
    },
    {
      id: "users" as const,
      label: "Users & Roles",
      icon: Users,
      badge: "RBAC",
    },
    {
      id: "orders" as const,
      label: "Orders",
      icon: ShoppingBag,
      badge: "Coming Soon",
      disabled: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0c0e17] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            onClick={onCloseMobile}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-cyan-400 font-black text-white shadow-lg shadow-brand/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-widest text-white">
                FLYDIGI
              </span>
              <span className="ml-1.5 rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                ADMIN
              </span>
              <p className="text-[10px] text-gray-500">Control Portal</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Admin Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    item.disabled
                      ? "cursor-not-allowed opacity-40"
                      : isActive
                        ? "bg-brand text-white shadow-lg shadow-brand/20"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-brand"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-black/25 text-white"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Storefront Shortcut
          </div>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4 text-cyan-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span>View Storefront</span>
            </div>
            <span className="text-[10px] text-gray-500">New tab</span>
          </Link>
        </div>

        {/* Admin User Profile & Logout Bottom Box */}
        <div className="border-t border-white/10 bg-[#090b12] p-3.5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/25 font-bold text-brand">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[10px] font-medium text-emerald-400">
                  ● Active Now
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              title="Log out"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
