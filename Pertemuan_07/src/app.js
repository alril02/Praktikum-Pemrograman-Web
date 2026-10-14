import express from "express";
import cors from "cors";

import { logger } from "./middleware/logger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { produkRouter } from "./routes/produk.routes.js";
import { pesananRouter } from "./routes/pesanan.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(logger);

const daftarOrigin = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim());
app.use(cors({ origin: daftarOrigin, exposedHeaders: ["X-Jumlah-Query", "Location"] }));

app.use(express.json({ limit: "100kb" }));

app.get("/api/v1/kesehatan", (req, res) => {
  res.json({ status: "ok", waktu: new Date().toISOString() });
});

app.use("/api/v1/produk", produkRouter);
app.use("/api/v1/pesanan", pesananRouter);

app.use(notFound);
app.use(errorHandler);
