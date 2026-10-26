import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import productRoutes from "./routes/productRoutes";

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse incoming JSON payloads

// Routes configuration
app.use("/api/products", productRoutes);

// Test API endpoint
app.get("/", (req, res) => {
  res.json({ message: "The Backend Shopping Controller system is ready" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
