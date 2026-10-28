import type { Product } from "../../../services/product.service";

interface ProductGalleryProps {
  product: Product;
  selectedImage: string;
  gallery: string[];
  onSelectImage: (imageUrl: string) => void;
}

export default function ProductGallery({
  product,
  selectedImage,
  gallery,
  onSelectImage,
}: ProductGalleryProps) {
  const currentImg = selectedImage || product.image;

  return (
    <div className="lg:col-span-7">
      {/* Main Image Showcase */}
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f] p-8 sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgb(var(--color-brand) / 0.22) 0%, rgb(var(--color-brand) / 0.08) 45%, transparent 72%)",
          }}
        />
        <img
          src={currentImg}
          alt={product.name}
          decoding="async"
          draggable={false}
          className="relative z-10 h-full w-full select-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] transition-all duration-500"
        />
      </div>

      {/* Gallery Thumbnails */}
      {gallery.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {gallery.map((imgUrl, index) => {
            const isSelected = currentImg === imgUrl;
            return (
              <button
                key={`${imgUrl}-${index}`}
                type="button"
                onClick={() => onSelectImage(imgUrl)}
                aria-label={`Xem ảnh ${index + 1} của ${product.name}`}
                className={`relative h-20 w-20 overflow-hidden rounded-xl border bg-[#0b0b0f] p-2 transition-all duration-200 sm:h-24 sm:w-24 ${
                  isSelected
                    ? "border-brand shadow-[0_0_15px_rgb(var(--color-brand)/0.35)]"
                    : "border-white/10 opacity-60 hover:border-white/30 hover:opacity-100"
                }`}
              >
                <img
                  src={imgUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

