import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductBySlug, type Product } from "../../../services/product.service";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Failed to load product details."
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export function useProductDetail() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    let isCancelled = false;

    const loadProduct = async () => {
      if (!slug) {
        if (!isCancelled) {
          setError("Product slug is missing.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getProductBySlug(slug);
        if (isCancelled) return;
        setProduct(data);
        setSelectedImage(data.images?.[0] || data.image);
        setQuantity(1);
        setIsLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        setError(getErrorMessage(err));
        setIsLoading(false);
      }
    };

    void loadProduct();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const gallery =
    product?.images && product.images.length > 0
      ? product.images
      : product
        ? [product.image]
        : [];

  const isOutOfStock = product?.inStock === false || product?.stock === 0;
  const maxStock =
    typeof product?.stock === "number" && product.stock > 0
      ? product.stock
      : 99;

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  return {
    slug,
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
  };
}

