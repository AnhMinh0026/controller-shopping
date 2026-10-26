import { Request, Response } from "express";
import slugify from "slugify";
import Product from "../models/Product";

// [GET] /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi Server";
    res.status(500).json({ success: false, message: errorMessage });
  }
};

// [GET] /api/products/:slug
// Get product details by slug
export const getProductBySlug = async (
  req: Request<{ slug: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi Server";
    res.status(500).json({ success: false, message: errorMessage });
  }
};

// [POST] /api/products
// Add new product
export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      price,
      description,
      features,
      stock,
      images,
      has3DModel,
      model3DUrl,
    } = req.body;

    // 1. Auto generate slug from product name
    const slug = slugify(name, {
      lower: true, // Convert to lowercase
      strict: true, // Remove special characters (keep only letters, numbers, and hyphens)
      locale: "vi", // Good support for Vietnamese
    });

    // 2. Check if product (slug) already exists
    const productExists = await Product.findOne({ slug });
    if (productExists) {
      res
        .status(400)
        .json({ success: false, message: "Product already exists" });
      return;
    }

    // 3. Create new product and save to database
    const product = await Product.create({
      name,
      slug,
      price,
      description,
      features,
      stock,
      images,
      has3DModel,
      model3DUrl,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi Server";
    res.status(500).json({ success: false, message: errorMessage });
  }
};

// [DELETE] /api/products/:slug
// Delete product by slug
export const deleteProduct = async (
  req: Request<{ slug: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;

    // Find and delete the product by slug
    const product = await Product.findOneAndDelete({ slug });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi Server";
    res.status(500).json({ success: false, message: errorMessage });
  }
};
