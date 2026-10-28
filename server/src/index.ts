import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import { initZaloOtpBot } from "./services/zaloBot.service";

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Start Zalo OTP Bot long-polling listener (if ZALO_BOT_TOKEN is set)
void initZaloOtpBot();

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalhostOrigin = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// Middleware configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman/curl) or localhost dev ports or configured origins
      if (
        !origin ||
        isLocalhostOrigin(origin) ||
        configuredOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // Allow HttpOnly refresh token cookies across origins
  }),
);
app.use(cookieParser());
app.use(express.json()); // Parse incoming JSON payloads

// Routes configuration
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);

// Test API endpoint
app.get("/", (req, res) => {
  res.json({ message: "The Backend Shopping Controller system is ready" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
