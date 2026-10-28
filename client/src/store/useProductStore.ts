import axios from "axios";
import { create } from "zustand";
import {
  DEFAULT_PRODUCTS_LIMIT,
  getProducts,
  type Product,
} from "../services/product.service";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;
  fetchInitialProducts: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch products."
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  isFetchingNextPage: false,
  page: 1,
  hasMore: false,
  error: null,

  fetchInitialProducts: async () => {
    if (get().isLoading) return;

    set({
      isLoading: true,
      isFetchingNextPage: false,
      error: null,
      page: 1,
      products: [],
      hasMore: false,
    });

    try {
      const response = await getProducts(1, DEFAULT_PRODUCTS_LIMIT);
      set({
        products: response.data,
        page: response.page,
        hasMore: response.page < response.totalPages,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error),
        isLoading: false,
        hasMore: false,
      });
    }
  },

  loadMoreProducts: async () => {
    const { isLoading, isFetchingNextPage, hasMore, page, products } = get();
    if (isLoading || isFetchingNextPage || !hasMore) return;

    const nextPage = page + 1;
    set({ isFetchingNextPage: true, error: null });

    try {
      const response = await getProducts(nextPage, DEFAULT_PRODUCTS_LIMIT);
      const existingIds = new Set(products.map((item) => item.id));
      const uniqueNewProducts = response.data.filter(
        (item) => !existingIds.has(item.id),
      );

      set({
        products: [...products, ...uniqueNewProducts],
        page: response.page,
        hasMore: response.page < response.totalPages,
        isFetchingNextPage: false,
      });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error),
        isFetchingNextPage: false,
      });
    }
  },
}));

