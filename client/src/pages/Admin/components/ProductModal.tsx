import { Image as ImageIcon, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Product, UpsertProductPayload } from "../../../services/product.service";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSave: (payload: UpsertProductPayload, slug?: string) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_IMAGE = "/images/products/vader-5-pro-showcase.png";

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  isSaving,
}: ProductModalProps) {
  const [name, setName] = useState(productToEdit?.name || "");
  const [price, setPrice] = useState(
    productToEdit ? String(productToEdit.price || "") : "",
  );
  const [stock, setStock] = useState(
    productToEdit ? String(productToEdit.stock ?? 10) : "10",
  );
  const [imageUrl, setImageUrl] = useState(
    productToEdit?.image || DEFAULT_IMAGE,
  );
  const [featuresText, setFeaturesText] = useState(
    productToEdit
      ? (productToEdit.features || []).join(", ")
      : "Hall Effect, 1000Hz Polling, Force-Adjustable",
  );
  const [description, setDescription] = useState(
    productToEdit?.description || "",
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: UpsertProductPayload = {
      name: name.trim(),
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      images: [imageUrl.trim() || DEFAULT_IMAGE],
      features: featuresText
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      description: description.trim(),
    };

    await onSave(payload, productToEdit?.slug);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f111a] p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white">
              {productToEdit ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm Mới"}
            </h3>
            <p className="text-xs text-gray-400">
              {productToEdit
                ? `Cập nhật thông số cho ${productToEdit.name}`
                : "Nhập thông tin sản phẩm tay cầm mới vào kho hàng"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Row 1: Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Tên sản phẩm tay cầm *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Flydigi Vader 5 Pro"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Row 2: Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Giá bán (VNĐ) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1790000"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Số lượng tồn kho *
              </label>
              <input
                type="number"
                min={0}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Image URL + Preview */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Đường dẫn hình ảnh (URL hoặc đường dẫn public) *
            </label>
            <div className="mt-1.5 flex gap-3">
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/products/vader-5-pro-showcase.png"
                className="flex-1 rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
              />
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black p-1">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Features */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Tính năng nổi bật (ngăn cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Hall Effect Joysticks, 1000Hz Polling, 4 Micro Switches"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Row 5: Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Mô tả chi tiết sản phẩm *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả công nghệ cần điều khiển, thời lượng pin, nền tảng hỗ trợ (PC, Switch, Mobile)..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full border border-brand bg-brand px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/25 transition-all hover:bg-transparent hover:text-brand disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : productToEdit ? "Lưu thay đổi" : "Tạo Sản Phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
