import { Request, Response } from "express";
import slugify from "slugify";
import Product from "../models/Product";

// [GET] /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
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
    const errorMessage = error instanceof Error ? error.message : "Server error";
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
    const { name, price, description, features, stock, images } = req.body;

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
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    res.status(500).json({ success: false, message: errorMessage });
  }
};

// [PUT] /api/products/:slug
// Update product details by slug
export const updateProduct = async (
  req: Request<{ slug: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const { name, price, description, features, stock, images } = req.body;

    // 1. Find existing product by slug
    const product = await Product.findOne({ slug });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // 2. If name is changed, regenerate slug and check for duplicate slug
    if (typeof name === "string" && name.trim() !== "") {
      const trimmedName = name.trim();
      const newSlug = slugify(trimmedName, {
        lower: true,
        strict: true,
        locale: "vi",
      });

      if (newSlug !== product.slug) {
        const duplicateProduct = await Product.findOne({
          slug: newSlug,
          _id: { $ne: product._id },
        });

        if (duplicateProduct) {
          res
            .status(400)
            .json({ success: false, message: "Product slug already exists" });
          return;
        }

        product.slug = newSlug;
      }

      product.name = trimmedName;
    }

    // 3. Update other fields if provided in request body
    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description;
    if (features !== undefined) product.features = features;
    if (stock !== undefined) product.stock = stock;
    if (images !== undefined) product.images = images;

    // 4. Save updated product (triggers Mongoose schema validators)
    const updatedProduct = await product.save();

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
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
    const errorMessage = error instanceof Error ? error.message : "Server error";
    res.status(500).json({ success: false, message: errorMessage });
  }
};
