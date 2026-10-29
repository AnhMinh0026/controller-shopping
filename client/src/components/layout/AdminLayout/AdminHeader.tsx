import { Menu, Plus, RefreshCw } from "lucide-react";
import type { AdminViewType } from "./AdminSidebar";

interface AdminHeaderProps {
  currentView: AdminViewType;
  onOpenMobileSidebar: () => void;
  onOpenAddProductModal: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

const VIEW_TITLES: Record<AdminViewType, { title: string; subtitle: string }> = {
  overview: {
    title: "System Overview",
    subtitle: "Real-time analytics & store performance",
  },
  products: {
    title: "Product Management",
    subtitle: "Add, update pricing, inventory, and Flydigi controllers",
  },
  users: {
    title: "Users & Access Control",
    subtitle: "Manage roles (Admin / Customer) & account security",
  },
  orders: {
    title: "Order Management",
    subtitle: "Track purchases & payment status",
  },
};

export default function AdminHeader({
  currentView,
  onOpenMobileSidebar,
  onOpenAddProductModal,
  onRefreshData,
  isRefreshing = false,
}: AdminHeaderProps) {
  const current = VIEW_TITLES[currentView];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#08090f]/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-white/10 p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Admin Portal
            </span>
            <span className="text-gray-600">/</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              {current.title}
            </span>
          </div>
          <p className="hidden text-xs text-gray-400 sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* System Online Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 md:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span>System Online</span>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefreshData}
          disabled={isRefreshing}
          title="Refresh data"
          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-gray-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin text-brand" : ""}`}
          />
        </button>

        {/* Quick Add Product Button (shows on products tab or anytime) */}
        <button
          type="button"
          onClick={onOpenAddProductModal}
          className="flex items-center gap-2 rounded-xl border border-brand bg-brand px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/20 transition-all hover:bg-transparent hover:text-brand"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>
    </header>
  );
}
