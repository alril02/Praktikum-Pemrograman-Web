// KUNCI JAWABAN DOSEN - salin ke src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { config } from "./config.js";
import { logger } from "./middleware/logger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { produkRouter } from "./routes/produk.routes.js";
import { pesananRouter } from "./routes/pesanan.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(logger);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, exposedHeaders: ["Location"] }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/v1/kesehatan", (req, res) => {
  res.json({ status: "ok", waktu: new Date().toISOString() });
});

const batasLogin = rateLimit({
  windowMs: 60_000,
  limit: config.loginMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { kode: "TERLALU_BANYAK_PERCOBAAN", pesan: "Terlalu banyak percobaan. Coba lagi nanti." } },
});
app.use("/api/v1/auth/masuk", batasLogin);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/produk", produkRouter);
app.use("/api/v1/pesanan", pesananRouter);

app.use(notFound);
app.use(errorHandler);
