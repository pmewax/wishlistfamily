import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/config/db.js";
import wishlistRoutes from "./src/routes/wishlistRoutes.js";

dotenv.config();
await connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/wishlists", wishlistRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});