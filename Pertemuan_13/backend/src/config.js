// Konfigurasi terpusat. GAGAL CEPAT bila rahasia hilang atau lemah.
import path from "node:path";

function wajib(nama, minPanjang = 1) {
  const nilai = process.env[nama] ?? "";
  if (nilai.length < minPanjang) {
    throw new Error(`Variabel lingkungan ${nama} wajib diatur (minimal ${minPanjang} karakter).`);
  }
  return nilai;
}

const angka = (nama, bawaan) => {
  const n = Number(process.env[nama]);
  return Number.isFinite(n) && n > 0 ? n : bawaan;
};

export const config = {
  jwtSecret: wajib("JWT_SECRET", 32),
  jwtTtl: process.env.JWT_TTL || "15m",
  jwtIssuer: "toko-api",
  jwtAudience: "toko-web",
  bcryptCost: angka("BCRYPT_COST", 12),
  loginMax: angka("LOGIN_MAX", 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()),

  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  maxUploadBytes: angka("MAX_UPLOAD_BYTES", 2 * 1024 * 1024),

  gatewayBaseUrl: wajib("GATEWAY_BASE_URL", 8).replace(/\/$/, ""),
  gatewayApiKey: wajib("GATEWAY_API_KEY", 16),
  gatewayWebhookSecret: wajib("GATEWAY_WEBHOOK_SECRET", 16),
  gatewayTimeoutMs: angka("GATEWAY_TIMEOUT_MS", 5000),
  toleransiWebhookDetik: 300,

  // Antrean
  jobMaxPercobaan: angka("JOB_MAX_PERCOBAAN", 5),
  jobBackoffMs: angka("JOB_BACKOFF_MS", 1000),
  jobPollMs: angka("JOB_POLL_MS", 500),
  jobLockTimeoutMs: angka("JOB_LOCK_TIMEOUT_MS", 60_000),
  emailDelayMs: angka("EMAIL_DELAY_MS", 1500),

  // Cache
  cacheTtlMs: angka("CACHE_TTL_MS", 30_000),
  cacheMaxEntries: angka("CACHE_MAX_ENTRIES", 500),
};
