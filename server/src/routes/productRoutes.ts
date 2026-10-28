import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = express.Router();

router
  .route("/")
  .get(getProducts) // Get all products
  .post(createProduct); // Add new product

router
  .route("/:slug")
  .get(getProductBySlug) // Get product details by slug
  .put(updateProduct) // Update product details by slug
  .patch(updateProduct) // Partial update product details by slug
  .delete(deleteProduct); // Delete product by slug

export default router;
