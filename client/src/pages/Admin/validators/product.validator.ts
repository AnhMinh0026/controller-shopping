import { z } from "zod";

export const DEFAULT_PRODUCT_IMAGE =
  "/images/products/vader-5-pro-showcase.png";

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .max(120, "Product name cannot exceed 120 characters"),
  price: z
    .number({ message: "Please enter a valid price" })
    .min(1000, "Minimum price is 1,000 VND")
    .max(100_000_000, "Price cannot exceed 100,000,000 VND"),
  stock: z
    .number({ message: "Please enter a valid stock quantity" })
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .max(100_000, "Maximum stock is 100,000"),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Please enter a product image URL"),
  featuresText: z
    .string()
    .trim()
    .min(3, "Please specify at least one key feature"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2,000 characters"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

