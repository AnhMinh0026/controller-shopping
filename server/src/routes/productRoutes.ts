import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  getProducts,
  updateProduct,
} from "../controllers/productController";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware";

const router = express.Router();

router
  .route("/")
  .get(getProducts) // Public: Customer & Guest can view products
  .post(requireAuth, requireAdmin, createProduct); // Admin only: Add new product

router
  .route("/:slug")
  .get(getProductBySlug) // Public: Customer & Guest can view product detail
  .put(requireAuth, requireAdmin, updateProduct) // Admin only: Full update product
  .patch(requireAuth, requireAdmin, updateProduct) // Admin only: Partial update product
  .delete(requireAuth, requireAdmin, deleteProduct); // Admin only: Delete product

export default router;
