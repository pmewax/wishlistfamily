import mongoose from "mongoose";

export default async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in .env");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}