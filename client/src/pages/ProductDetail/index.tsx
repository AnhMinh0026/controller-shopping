import { Link } from "react-router-dom";
import { ScrollToTopButton } from "../../components/common/ScrollToTopButton";
import Header from "../../components/layout/Header/Header";
import ProductDetailSkeleton from "./components/ProductDetailSkeleton";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductPurchaseBar from "./components/ProductPurchaseBar";
import { useProductDetail } from "./hooks/useProductDetail";

export default function ProductDetailPage() {
  const {
    product,
    selectedImage,
    setSelectedImage,
    gallery,
    quantity,
    isLoading,
    error,
    isOutOfStock,
    maxStock,
    handleDecreaseQuantity,
    handleIncreaseQuantity,
  } = useProductDetail();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-gray-400"
        >
          <Link to="/" className="transition-colors hover:text-white">
            Trang Chủ
          </Link>
          <span>/</span>
          <Link to="/products" className="transition-colors hover:text-white">
            Sản Phẩm
          </Link>
          {product && (
            <>
              <span>/</span>
              <span className="font-semibold text-brand">{product.name}</span>
            </>
          )}
        </nav>

        {isLoading ? (
          <ProductDetailSkeleton />
        ) : error || !product ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0f] px-6 py-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">
              SẢN PHẨM KHÔNG TỒN TẠI
            </p>
            <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-wide text-white sm:text-3xl">
              {error || "Không tìm thấy thông tin sản phẩm"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
              Mẫu tay cầm bạn đang tìm kiếm có thể đã bị gỡ hoặc đường dẫn không chính xác.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand px-6 py-3 text-xs font-bold uppercase tracking-widest text-brand transition-all duration-300 hover:bg-brand hover:text-white"
            >
              Quay lại danh mục sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Image Showcase & Gallery */}
            <ProductGallery
              product={product}
              selectedImage={selectedImage}
              gallery={gallery}
              onSelectImage={setSelectedImage}
            />

            {/* Right Column: Information, Specs & Purchase Controls */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <ProductInfo product={product} isOutOfStock={isOutOfStock} />

              <ProductPurchaseBar
                quantity={quantity}
                maxStock={maxStock}
                isOutOfStock={isOutOfStock}
                onDecrease={handleDecreaseQuantity}
                onIncrease={handleIncreaseQuantity}
              />
            </div>
          </div>
        )}
      </main>

      <ScrollToTopButton />
    </div>
  );
}
