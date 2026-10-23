import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors()); // Enable CORS for cross-origin API requests
app.use(express.json()); // Parse incoming JSON payloads

// Test API endpoint
app.get("/", (req, res) => {
  res.json({ message: "The Backend Shopping Controller system is ready" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
