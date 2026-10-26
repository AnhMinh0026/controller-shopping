import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // 1. Check the environment variables
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is strictly required in environment variables.",
      );
    }

    // 2. Proceed with the connection
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB has connected successfully: ${conn.connection.host}`);
  } catch (error) {
    // 3. Safely cast the error variable to get detailed logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error connecting to MongoDB: ${errorMessage}`);

    process.exit(1);
  }
};
