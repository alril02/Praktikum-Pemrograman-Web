// Konfigurasi terpusat. Nilai wajib divalidasi saat start (fail fast).
import path from "node:path";
import { periksaEnv } from "./lib/env.js";

const pemeriksaan = periksaEnv(process.env);
if (!pemeriksaan.ok) {
  throw new Error(`Konfigurasi tidak valid:\n - ${pemeriksaan.masalah.join("\n - ")}`);
}
for (const p of pemeriksaan.peringatan) {
  console.warn(JSON.stringify({ level: "warn", pesan: "peringatan konfigurasi", detail: p }));
}

const angka = (nama, bawaan) => {
  const n = Number(process.env[nama]);
  return Number.isFinite(n) && n >= 0 ? n : bawaan;
};

export const config = {
  env: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtTtl: process.env.JWT_TTL || "15m",
  jwtIssuer: "toko-api",
  jwtAudience: "toko-web",
  bcryptCost: angka("BCRYPT_COST", 12) || 12,
  loginMax: angka("LOGIN_MAX", 10) || 10,
  corsOrigins: (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  trustProxy: angka("TRUST_PROXY", 0),

  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  maxUploadBytes: angka("MAX_UPLOAD_BYTES", 2 * 1024 * 1024) || 2 * 1024 * 1024,

  gatewayBaseUrl: process.env.GATEWAY_BASE_URL.replace(/\/$/, ""),
  gatewayApiKey: process.env.GATEWAY_API_KEY,
  gatewayWebhookSecret: process.env.GATEWAY_WEBHOOK_SECRET,
  gatewayTimeoutMs: angka("GATEWAY_TIMEOUT_MS", 5000) || 5000,
  toleransiWebhookDetik: 300,

  jobMaxPercobaan: angka("JOB_MAX_PERCOBAAN", 5) || 5,
  jobBackoffMs: angka("JOB_BACKOFF_MS", 1000) || 1000,
  jobPollMs: angka("JOB_POLL_MS", 500) || 500,
  jobLockTimeoutMs: angka("JOB_LOCK_TIMEOUT_MS", 60_000) || 60_000,
  emailDelayMs: angka("EMAIL_DELAY_MS", 1500) || 1500,

  cacheTtlMs: angka("CACHE_TTL_MS", 30_000) || 30_000,
  cacheMaxEntries: angka("CACHE_MAX_ENTRIES", 500) || 500,
};
