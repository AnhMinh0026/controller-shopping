import { Progress, Tag } from "antd";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { AdminViewType } from "../../../components/layout/AdminLayout/AdminSidebar";
import type {
  AdminStats,
  AdminUserItem,
} from "../../../services/admin.service";
import type { Product } from "../../../services/product.service";
import { formatVND } from "../../../utils/formatCurrency";

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
  const totalAdmins =
    stats?.totalAdmins || users.filter((u) => u.role === "admin").length || 0;
  const totalCustomers =
    stats?.totalCustomers || totalUsers - totalAdmins || 0;
  const totalProducts = stats?.totalProducts || products.length || 0;
  const outOfStockProducts =
    stats?.outOfStockProducts ||
    products.filter((p) => (p.stock ?? 0) <= 0).length ||
    0;
  const inStockProducts = Math.max(0, totalProducts - outOfStockProducts);

  const adminRatio =
    totalUsers > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 0;
  const inStockRatio =
    totalProducts > 0 ? Math.round((inStockProducts / totalProducts) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* 5 High-Impact Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalUsers}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="font-semibold text-emerald-400">100%</span>
            <span>synced with DB</span>
          </div>
        </div>

        <div className="rounded-2xl border border-brand/40 bg-brand/10 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              Administrators (Admin)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalAdmins}</p>
          <div className="mt-2 text-[11px] text-gray-300">
            Represents <span className="font-bold text-brand">{adminRatio}%</span> of all accounts
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Customers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">
            {totalCustomers}
          </p>
          <div className="mt-2 text-[11px] text-gray-400">
            Storefront shoppers & OTP users
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Active Products
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">{totalProducts}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{inStockProducts} items available</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Out of Stock
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-white">
            {outOfStockProducts}
          </p>
          <div className="mt-2 text-[11px] text-gray-400">
            {outOfStockProducts === 0 ? "Inventory healthy" : "Restock required"}
          </div>
        </div>
      </div>

      {/* Middle Row: Ant Design Progress Ratios */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Role Distribution (RBAC)
              </h3>
              <p className="text-xs text-gray-400">
                Administrator vs. Customer account ratio
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              <span>View details</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-white">
                  Administrators (Admin)
                </span>
                <span className="font-mono font-bold text-brand">
                  {totalAdmins} ({adminRatio}%)
                </span>
              </div>
              <Progress
                percent={adminRatio}
                showInfo={false}
                strokeColor="#285afa"
                railColor="rgba(255,255,255,0.08)"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-white">
                  Customers
                </span>
                <span className="font-mono font-bold text-cyan-400">
                  {totalCustomers} ({100 - adminRatio}%)
                </span>
              </div>
              <Progress
                percent={100 - adminRatio}
                showInfo={false}
                strokeColor="#00d8ff"
                railColor="rgba(255,255,255,0.08)"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Inventory Health
              </h3>
              <p className="text-xs text-gray-400">
                In-stock vs. out-of-stock items ratio
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("products")}
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              <span>Manage stock</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-white">
                  In-Stock Products
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {inStockProducts} ({inStockRatio}%)
                </span>
              </div>
              <Progress
                percent={inStockRatio}
                showInfo={false}
                strokeColor="#10b981"
                railColor="rgba(255,255,255,0.08)"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-white">
                  Out-of-Stock Items
                </span>
                <span className="font-mono font-bold text-rose-400">
                  {outOfStockProducts} ({100 - inStockRatio}%)
                </span>
              </div>
              <Progress
                percent={100 - inStockRatio}
                showInfo={false}
                strokeColor="#f43f5e"
                railColor="rgba(255,255,255,0.08)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Glance Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recently Registered Users
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View all ({users.length})
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {users.slice(0, 5).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold uppercase text-brand">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{u.name}</p>
                    <p className="font-mono text-[11px] text-gray-400">
                      {u.email || u.phone || "—"}
                    </p>
                  </div>
                </div>

                <Tag
                  color={u.role === "admin" ? "processing" : "default"}
                  className="m-0 font-bold uppercase"
                >
                  {u.role}
                </Tag>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Product Catalog Overview
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("products")}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Manage ({products.length})
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {products.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3"
              >
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

                <Tag
                  color={(p.stock ?? 0) > 0 ? "success" : "error"}
                  className="m-0 font-semibold"
                >
                  {(p.stock ?? 0) > 0 ? `${p.stock} in stock` : "Out of stock"}
                </Tag>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
