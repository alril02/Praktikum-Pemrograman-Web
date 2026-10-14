import express from "express";
import cors from "cors";

import { logger } from "./middleware/logger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { produkRouter } from "./routes/produk.routes.js";

export const app = express();

app.disable("x-powered-by");

// ---------- Middleware global (URUTAN PENTING) ----------
app.use(logger);

// TODO 1: aktifkan CORS hanya untuk origin pada process.env.CORS_ORIGINS (dipisah koma)
//   petunjuk: cors({ origin: daftarOrigin })
const daftarOrigin = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim());
app.use(cors());

app.use(express.json({ limit: "100kb" }));

// ---------- Route ----------
app.get("/api/v1/kesehatan", (req, res) => {
  res.json({ status: "ok", waktu: new Date().toISOString() });
});

app.use("/api/v1/produk", produkRouter);

// ---------- Setelah semua route ----------
app.use(notFound);
app.use(errorHandler);
