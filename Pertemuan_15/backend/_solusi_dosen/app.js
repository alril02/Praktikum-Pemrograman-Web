// KUNCI JAWABAN DOSEN - salin ke src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { config } from "./config.js";
import { logger } from "./middleware/logger.js";
import { serverTiming } from "./middleware/serverTiming.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { produkRouter } from "./routes/produk.routes.js";
import { pesananRouter } from "./routes/pesanan.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { pasangDokumentasi } from "./docs/swagger.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy);

app.use(logger);
app.use(serverTiming);

// Dokumentasi dipasang SEBELUM helmet agar CSP bawaan tidak memblokir skrip inisialisasi Swagger UI.
// Matikan pada produksi bila API tidak untuk umum: DOCS_ENABLED=0
pasangDokumentasi(app);

app.use(helmet());
app.use(compression());

app.use("/api/v1", healthRouter);
app.use("/api/v1/webhook", webhookRouter);

app.use(cors({ origin: config.corsOrigins, exposedHeaders: ["Location", "Retry-After", "X-Cache", "Server-Timing", "X-Request-Id"] }));

app.use(
  "/uploads",
  express.static(config.uploadDir, {
    index: false,
    dotfiles: "deny",
    fallthrough: false,
    setHeaders(res) {
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

app.use(express.json({ limit: "100kb" }));

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
app.use("/api/v1/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);
