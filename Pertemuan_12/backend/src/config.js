// Konfigurasi terpusat. GAGAL CEPAT bila rahasia hilang atau lemah.
import path from "node:path";

function wajib(nama, minPanjang = 1) {
  const nilai = process.env[nama] ?? "";
  if (nilai.length < minPanjang) {
    throw new Error(`Variabel lingkungan ${nama} wajib diatur (minimal ${minPanjang} karakter).`);
  }
  return nilai;
}

const jwtSecret = wajib("JWT_SECRET", 32);

export const config = {
  jwtSecret,
  jwtTtl: process.env.JWT_TTL || "15m",
  jwtIssuer: "toko-api",
  jwtAudience: "toko-web",
  bcryptCost: Number(process.env.BCRYPT_COST) || 12,
  loginMax: Number(process.env.LOGIN_MAX) || 10,
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()),

  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 2 * 1024 * 1024,

  // Payment gateway (rahasia: hanya di server)
  gatewayBaseUrl: wajib("GATEWAY_BASE_URL", 8).replace(/\/$/, ""),
  gatewayApiKey: wajib("GATEWAY_API_KEY", 16),
  gatewayWebhookSecret: wajib("GATEWAY_WEBHOOK_SECRET", 16),
  gatewayTimeoutMs: Number(process.env.GATEWAY_TIMEOUT_MS) || 5000,
  toleransiWebhookDetik: 300,
};
