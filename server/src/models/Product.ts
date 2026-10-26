import mongoose, { Schema, Document } from "mongoose";

// 1. TypeScript Interface: Helps VS Code with code hints (Autocomplete) and strict type checking
export interface IProduct extends Document {
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
  stock: number;
  images: string[];
  has3DModel: boolean;
  model3DUrl?: string;
}

// 2. Mongoose Schema: A protective layer class, checks data before pushing it into MongoDB
const productSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    features: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock quantity is invalid"],
      default: 0,
    },
    images: {
      type: [String],
      required: [true, "Product must have at least 1 image"],
    },
    has3DModel: {
      type: Boolean,
      default: false,
    },
    model3DUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// 3. Export the model for controllers to use
const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
