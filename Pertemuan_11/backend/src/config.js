// Konfigurasi terpusat. GAGAL CEPAT bila rahasia hilang atau lemah.
import path from "node:path";

const jwtSecret = process.env.JWT_SECRET ?? "";

if (jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET wajib diatur (minimal 32 karakter). Hasilkan dengan: " +
      "node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
  );
}

export const config = {
  jwtSecret,
  jwtTtl: process.env.JWT_TTL || "15m",
  jwtIssuer: "toko-api",
  jwtAudience: "toko-web",
  bcryptCost: Number(process.env.BCRYPT_COST) || 12,
  loginMax: Number(process.env.LOGIN_MAX) || 10,
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()),

  // Unggahan
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 2 * 1024 * 1024,
};
