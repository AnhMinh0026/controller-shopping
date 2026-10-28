import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { AdminStats, AdminUserItem } from "../../../services/admin.service";
import type { Product } from "../../../services/product.service";
import { formatVND } from "../../../utils/formatCurrency";
import type { AdminViewType } from "../../../components/layout/AdminLayout/AdminSidebar";

interface OverviewViewProps {
  stats: AdminStats | null;
  users: AdminUserItem[];
  products: Product[];
  onNavigateTab: (tab: AdminViewType) => void;
}

export default function OverviewView({
  stats,
  users,
  products,
  onNavigateTab,
}: OverviewViewProps) {
  const totalUsers = stats?.totalUsers || users.length || 0;
  const totalAdmins = stats?.totalAdmins || users.filter((u) => u.role === "admin").length || 0;
  const totalCustomers = stats?.totalCustomers || (totalUsers - totalAdmins) || 0;
  const totalProducts = stats?.totalProducts || products.length || 0;
  const outOfStockProducts = stats?.outOfStockProducts || products.filter((p) => (p.stock ?? 0) <= 0).length || 0;
  const inStockProducts = Math.max(0, totalProducts - outOfStockProducts);

  const adminRatio = totalUsers > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 0;
  const inStockRatio = totalProducts > 0 ? Math.round((inStockProducts / totalProducts) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* 5 High-Impact Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Stat 1: Total Users */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Tổng Tài Khoản
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalUsers}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="font-semibold text-emerald-400">100%</span>
            <span>đã được đồng bộ DB</span>
          </div>
        </div>

        {/* Stat 2: Admins */}
        <div className="rounded-2xl border border-brand/40 bg-brand/10 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              Quản Trị Viên (Admin)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalAdmins}</p>
          <div className="mt-2 text-[11px] text-gray-300">
            Chiếm <span className="font-bold text-brand">{adminRatio}%</span> tổng thành viên
          </div>
        </div>

        {/* Stat 3: Customers */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Khách Hàng (Customer)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalCustomers}</p>
          <div className="mt-2 text-[11px] text-gray-400">
            Mua sắm & nhận OTP
          </div>
        </div>

        {/* Stat 4: Total Products */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Sản Phẩm Trong Kho
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalProducts}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{inStockProducts} mẫu đang mở bán</span>
          </div>
        </div>

        {/* Stat 5: Out of Stock */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Hết Hàng / Chờ Nhập
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{outOfStockProducts}</p>
          <div className="mt-2 text-[11px] text-gray-400">
            {outOfStockProducts === 0 ? "Kho hàng đầy đủ" : "Cần bổ sung kho"}
          </div>
        </div>
      </div>

      {/* Middle Row: Ratios & System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Role Distribution Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Phân Bổ Quyền Truy Cập (RBAC)
              </h3>
              <p className="text-xs text-gray-400">
                Tỷ lệ tài khoản Quản trị viên so với Khách hàng
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              <span>Xem chi tiết</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-white">Quản trị viên (Admin)</span>
                <span className="font-mono text-brand font-bold">{totalAdmins} ({adminRatio}%)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-brand transition-all duration-500"
                  style={{ width: `${adminRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-white">Khách hàng (Customer)</span>
                <span className="font-mono text-cyan-400 font-bold">{totalCustomers} ({100 - adminRatio}%)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${100 - adminRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Status Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Tình Trạng Kho Hàng
              </h3>
              <p className="text-xs text-gray-400">
                Tỷ lệ sản phẩm sẵn sàng giao ngay
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("products")}
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              <span>Quản lý kho</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-white">Còn hàng mở bán</span>
                <span className="font-mono text-emerald-400 font-bold">{inStockProducts} ({inStockRatio}%)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${inStockRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold text-white">Hết hàng / Chờ cập nhật</span>
                <span className="font-mono text-rose-400 font-bold">{outOfStockProducts} ({100 - inStockRatio}%)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${100 - inStockRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Glance Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest Users */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Tài Khoản Mới Nhất
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Xem tất cả ({users.length})
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand uppercase">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{u.name}</p>
                    <p className="text-[11px] font-mono text-gray-400">
                      {u.email || u.phone || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      u.role === "admin"
                        ? "bg-brand/20 text-brand border border-brand/40"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Sản Phẩm Trong Hệ Thống
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("products")}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Quản lý ({products.length})
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-9 w-9 rounded-lg border border-white/10 bg-black object-contain p-1"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{p.name}</p>
                    <p className="text-[11px] font-semibold text-brand">
                      {formatVND(p.price)}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    (p.stock ?? 0) > 0
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {p.stock ?? 0} máy
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
