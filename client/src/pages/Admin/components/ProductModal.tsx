import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "antd";
import { Image as ImageIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import type {
  Product,
  UpsertProductPayload,
} from "../../../services/product.service";
import {
  DEFAULT_PRODUCT_IMAGE,
  productFormSchema,
  type ProductFormValues,
} from "../validators/product.validator";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSave: (payload: UpsertProductPayload, slug?: string) => Promise<void>;
  isSaving: boolean;
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  isSaving,
}: ProductModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: productToEdit?.name || "",
      price: productToEdit?.price ?? 1790000,
      stock: productToEdit?.stock ?? 15,
      imageUrl: productToEdit?.image || DEFAULT_PRODUCT_IMAGE,
      featuresText: productToEdit
        ? (productToEdit.features || []).join(", ")
        : "Hall Effect Joysticks, 1000Hz Polling, Force-Adjustable Triggers",
      description: productToEdit?.description || "",
    },
  });

  const watchedImageUrl = useWatch({
    control,
    name: "imageUrl",
    defaultValue: productToEdit?.image || DEFAULT_PRODUCT_IMAGE,
  });

  const onFormSubmit = async (values: ProductFormValues) => {
    const payload: UpsertProductPayload = {
      name: values.name.trim(),
      price: values.price,
      stock: values.stock,
      images: [values.imageUrl.trim() || DEFAULT_PRODUCT_IMAGE],
      features: values.featuresText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      description: values.description.trim(),
    };

    await onSave(payload, productToEdit?.slug);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnHidden
      title={
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            {productToEdit ? "Edit Product" : "Add New Product"}
          </h3>
          <p className="mt-0.5 text-xs font-normal text-gray-400">
            {productToEdit
              ? `Update specifications for ${productToEdit.name}`
              : "Enter new gaming controller details (validated with Zod schema)"}
          </p>
        </div>
      }
    >
      <form
        onSubmit={(e) => void handleSubmit(onFormSubmit)(e)}
        className="mt-4 space-y-4"
        noValidate
      >
        {/* Row 1: Product Name */}
        <div>
          <label
            htmlFor="rhf-product-name"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-300"
          >
            Product Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="rhf-product-name"
            type="text"
            placeholder="e.g. Flydigi Vader 5 Pro"
            {...register("name")}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
          {errors.name && (
            <p className="mt-1 text-[11px] text-rose-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Row 2: Price & Stock */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="rhf-product-price"
              className="block text-[11px] font-bold uppercase tracking-wider text-gray-300"
            >
              Price (VND) <span className="text-rose-400">*</span>
            </label>
            <input
              id="rhf-product-price"
              type="number"
              step={1000}
              placeholder="1790000"
              {...register("price", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
            {errors.price && (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.price.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="rhf-product-stock"
              className="block text-[11px] font-bold uppercase tracking-wider text-gray-300"
            >
              Stock Quantity <span className="text-rose-400">*</span>
            </label>
            <input
              id="rhf-product-stock"
              type="number"
              placeholder="15"
              {...register("stock", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
            {errors.stock && (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.stock.message}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Image URL + Live Preview */}
        <div>
          <label
            htmlFor="rhf-product-image"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-300"
          >
            Image URL / Public Path <span className="text-rose-400">*</span>
          </label>
          <div className="mt-1.5 flex gap-3">
            <input
              id="rhf-product-image"
              type="text"
              placeholder="/images/products/vader-5-pro-showcase.png"
              {...register("imageUrl")}
              className="flex-1 rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black p-1">
              {watchedImageUrl ? (
                <img
                  src={watchedImageUrl}
                  alt="Preview"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      DEFAULT_PRODUCT_IMAGE;
                  }}
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
          {errors.imageUrl && (
            <p className="mt-1 text-[11px] text-rose-400">
              {errors.imageUrl.message}
            </p>
          )}
        </div>

        {/* Row 4: Features */}
        <div>
          <label
            htmlFor="rhf-product-features"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-300"
          >
            Key Features (comma-separated) <span className="text-rose-400">*</span>
          </label>
          <input
            id="rhf-product-features"
            type="text"
            placeholder="Hall Effect Joysticks, 1000Hz Polling, 4 Micro Switches"
            {...register("featuresText")}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
          {errors.featuresText && (
            <p className="mt-1 text-[11px] text-rose-400">
              {errors.featuresText.message}
            </p>
          )}
        </div>

        {/* Row 5: Description */}
        <div>
          <label
            htmlFor="rhf-product-desc"
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-300"
          >
            Product Overview & Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="rhf-product-desc"
            rows={4}
            placeholder="Describe controller specifications, polling rate, platform support (PC, Switch, Mobile)..."
            {...register("description")}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
          {errors.description && (
            <p className="mt-1 text-[11px] text-rose-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl border border-brand bg-brand px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/25 transition-all hover:bg-transparent hover:text-brand disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : productToEdit
                ? "Save Changes"
                : "Create Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
