import { Popconfirm, Segmented, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit2, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
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

  const columns: ColumnsType<Product> = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_value, record) => (
        <div className="flex items-center gap-3.5">
          <img
            src={record.image}
            alt={record.name}
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-black object-contain p-1.5"
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{record.name}</p>
            {record.slug && (
              <Link
                to={`/products/${record.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-400 hover:text-brand"
              >
                <span>/{record.slug}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "price",
      key: "price",
      width: 150,
      sorter: (a, b) => a.price - b.price,
      render: (price: number) => (
        <span className="font-mono font-bold text-white">
          {formatVND(price)}
        </span>
      ),
    },
    {
      title: "Inventory",
      dataIndex: "stock",
      key: "stock",
      width: 150,
      sorter: (a, b) => (a.stock ?? 0) - (b.stock ?? 0),
      render: (stock: number | undefined) => {
        const count = stock ?? 0;
        return count > 0 ? (
          <Tag color="success" className="m-0 font-semibold">
            In Stock ({count})
          </Tag>
        ) : (
          <Tag color="error" className="m-0 font-semibold">
            Out of Stock (0)
          </Tag>
        );
      },
    },
    {
      title: "Key Features",
      dataIndex: "features",
      key: "features",
      render: (features: string[] | undefined) => {
        const list = features || [];
        return (
          <div className="flex max-w-xs flex-wrap gap-1">
            {list.slice(0, 3).map((item) => (
              <Tag key={item} className="m-0 text-[11px]">
                {item}
              </Tag>
            ))}
            {list.length > 3 && (
              <Tooltip title={list.slice(3).join(", ")}>
                <Tag color="blue" className="m-0 cursor-pointer text-[11px]">
                  +{list.length - 3}
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 170,
      render: (_value, record) => (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditProduct(record)}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-brand hover:text-brand"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          <Popconfirm
            title="Delete this product?"
            description={`Are you sure you want to permanently delete "${record.name}"?`}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDeleteProduct(record)}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

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
            placeholder="Search by product name or slug..."
            className="w-full rounded-xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
        </div>

        {/* Antd Segmented Filter & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<StockFilter>
            value={stockFilter}
            onChange={(val) => setStockFilter(val)}
            options={[
              { label: `All (${products.length})`, value: "all" },
              { label: "In Stock", value: "in_stock" },
              { label: "Out of Stock", value: "out_of_stock" },
            ]}
          />

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl border border-brand bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand/20 transition-all hover:bg-transparent hover:text-brand"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Ant Design Data Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] p-2 shadow-lg">
        <Table<Product>
          rowKey="id"
          columns={columns}
          dataSource={filteredProducts}
          pagination={{
            pageSize: 6,
            showSizeChanger: true,
            pageSizeOptions: [6, 12, 24],
            showTotal: (total) => `Total ${total} products`,
          }}
          scroll={{ x: 760 }}
        />
      </div>
    </div>
  );
}
