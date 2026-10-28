import axiosClient from "../utils/axiosClient";

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  tagline?: string;
  description?: string;
  features?: string[];
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  badge?: string;
  stock?: number;
  inStock?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

interface RawBackendProduct {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  category?: string;
  tagline?: string;
  description?: string;
  features?: string[];
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  badge?: string;
  stock?: number;
  inStock?: boolean;
}

interface RawProductsApiResponse {
  success?: boolean;
  data: RawBackendProduct[];
  total?: number;
  page?: number;
  totalPages?: number;
}

interface RawProductDetailApiResponse {
  success?: boolean;
  data: RawBackendProduct;
}

export const DEFAULT_PRODUCTS_LIMIT = 12;

function normalizeProduct(raw: RawBackendProduct, index: number = 0): Product {
  const images = Array.isArray(raw.images) ? raw.images : [];
  const primaryImage =
    raw.image || images[0] || "/images/products/vader-5-pro-showcase.png";

  return {
    id: raw.id || raw._id || raw.slug || `product-${index}`,
    name: raw.name,
    slug: raw.slug,
    category: raw.category,
    tagline: raw.tagline || raw.description,
    description: raw.description,
    features: Array.isArray(raw.features) ? raw.features : [],
    price: Number(raw.price) || 0,
    originalPrice: raw.originalPrice,
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage],
    badge: raw.badge,
    stock: raw.stock,
    inStock:
      typeof raw.inStock === "boolean"
        ? raw.inStock
        : typeof raw.stock === "number"
          ? raw.stock > 0
          : true,
  };
}

export async function getProducts(
  page: number = 1,
  limit: number = DEFAULT_PRODUCTS_LIMIT,
): Promise<PaginatedResponse<Product>> {
  const response = await axiosClient.get<RawProductsApiResponse>("/products", {
    params: { page, limit },
  });

  const payload = response.data;
  const rawList = Array.isArray(payload.data) ? payload.data : [];
  const normalized = rawList.map((item, idx) => normalizeProduct(item, idx));

  // If the backend already paginated the response, use its metadata directly.
  if (
    typeof payload.total === "number" &&
    typeof payload.totalPages === "number"
  ) {
    return {
      data: normalized,
      total: payload.total,
      page: payload.page ?? page,
      totalPages: payload.totalPages,
    };
  }

  // Fallback client-side slicing if the backend returns the full array at once.
  const total = normalized.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const sliced = normalized.slice(start, start + limit);

  return {
    data: sliced,
    total,
    page,
    totalPages,
  };
}

export interface UpsertProductPayload {
  name: string;
  price: number;
  description: string;
  features: string[];
  stock: number;
  images: string[];
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const response = await axiosClient.get<RawProductDetailApiResponse>(
    `/products/${encodeURIComponent(slug)}`,
  );
  return normalizeProduct(response.data.data);
}

export async function createProduct(
  payload: UpsertProductPayload,
): Promise<Product> {
  const response = await axiosClient.post<RawProductDetailApiResponse>(
    "/products",
    payload,
  );
  return normalizeProduct(response.data.data);
}

export async function updateProduct(
  slug: string,
  payload: Partial<UpsertProductPayload>,
): Promise<Product> {
  const response = await axiosClient.put<RawProductDetailApiResponse>(
    `/products/${encodeURIComponent(slug)}`,
    payload,
  );
  return normalizeProduct(response.data.data);
}

export async function deleteProduct(slug: string): Promise<void> {
  await axiosClient.delete(`/products/${encodeURIComponent(slug)}`);
}

export const productService = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
