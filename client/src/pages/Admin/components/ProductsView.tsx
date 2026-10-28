import {
  Boxes,
  Edit2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../../services/product.service";
import { formatVND } from "../../../utils/formatCurrency";

interface ProductsViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

type StockFilter = "all" | "in_stock" | "out_of_stock";

export default function ProductsView({
  products,
  onOpenAddModal,
  onEditProduct,
  onDeleteProduct,
}: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q));

      const stockCount = p.stock ?? 0;
      const matchesStock =
        stockFilter === "all"
          ? true
          : stockFilter === "in_stock"
            ? stockCount > 0
            : stockCount <= 0;

      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f111a] p-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm hoặc đường dẫn slug..."
            className="w-full rounded-xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
        </div>

        {/* Filters & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stock Filter */}
          <div className="flex rounded-xl border border-white/10 bg-black/60 p-1">
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                stockFilter === "all"
                  ? "bg-brand text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Tất cả ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("in_stock")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                stockFilter === "in_stock"
                  ? "bg-emerald-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Còn hàng
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("out_of_stock")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                stockFilter === "out_of_stock"
                  ? "bg-rose-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Hết hàng
            </button>
          </div>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl border border-brand bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand/20 transition-all hover:bg-transparent hover:text-brand"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Mới</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="py-3.5 pl-6 pr-4">Sản Phẩm</th>
                <th className="px-4 py-3.5">Giá Bán</th>
                <th className="px-4 py-3.5">Kho Hàng</th>
                <th className="px-4 py-3.5">Tính Năng</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Boxes className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                    Không tìm thấy sản phẩm nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const inStock = (p.stock ?? 0) > 0;
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Product Thumbnail + Title + Slug */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-black object-contain p-1.5"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">
                              {p.name}
                            </p>
                            {p.slug && (
                              <Link
                                to={`/products/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-400 hover:text-brand"
                              >
                                <span>/{p.slug}</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 font-mono font-bold text-white">
                        {formatVND(p.price)}
                      </td>

                      {/* Stock Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            inStock
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              inStock ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          {p.stock ?? 0} chiếc
                        </span>
                      </td>

                      {/* Features tags */}
                      <td className="px-4 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {(p.features || []).slice(0, 3).map((f) => (
                            <span
                              key={f}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-300"
                            >
                              {f}
                            </span>
                          ))}
                          {(p.features || []).length > 3 && (
                            <span className="text-[10px] text-gray-500">
                              +{(p.features || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            title="Chỉnh sửa sản phẩm"
                            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-brand hover:text-brand"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p)}
                            title="Xóa sản phẩm"
                            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

