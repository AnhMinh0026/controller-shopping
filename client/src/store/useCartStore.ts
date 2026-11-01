import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../services/product.service";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        const maxStock =
          typeof product.stock === "number" ? product.stock : 99;

        if (maxStock <= 0) {
          toast.error(`"${product.name}" is currently out of stock.`);
          return;
        }

        const existingIndex = currentItems.findIndex(
          (item) => item.product.id === product.id,
        );

        if (existingIndex >= 0) {
          const existing = currentItems[existingIndex];
          const nextQuantity = Math.min(
            existing.quantity + quantity,
            maxStock,
          );

          if (existing.quantity >= maxStock) {
            toast.warning(
              `Maximum available stock (${maxStock}) reached for "${product.name}".`,
            );
            return;
          }

          const updated = [...currentItems];
          updated[existingIndex] = {
            ...existing,
            product,
            quantity: nextQuantity,
          };
          set({ items: updated });
          toast.success(
            `Updated "${product.name}" quantity in cart (${nextQuantity})`,
          );
        } else {
          const addedQty = Math.min(quantity, maxStock);
          set({
            items: [...currentItems, { product, quantity: addedQty }],
          });
          toast.success(`Added ${addedQty} × "${product.name}" to cart`);
        }
      },

      removeItem: (productId) => {
        const currentItems = get().items;
        const removed = currentItems.find(
          (item) => item.product.id === productId,
        );
        set({
          items: currentItems.filter((item) => item.product.id !== productId),
        });
        if (removed) {
          toast.info(`Removed "${removed.product.name}" from cart`);
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const currentItems = get().items;
        set({
          items: currentItems.map((item) => {
            if (item.product.id !== productId) return item;
            const maxStock =
              typeof item.product.stock === "number"
                ? item.product.stock
                : 99;
            return {
              ...item,
              quantity: Math.min(quantity, Math.max(1, maxStock)),
            };
          }),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "flydigi-cart-storage",
    },
  ),
);

