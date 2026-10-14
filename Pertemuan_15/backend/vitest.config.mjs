import { defineConfig } from "vitest/config";

// Lingkungan uji: database SQLite terpisah (prisma/test.db) yang dibuat ulang pada setiap run.
// Nilai di bawah BUKAN rahasia: khusus pengujian.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    globalSetup: ["tests/setup/global.mjs"],
    fileParallelism: false, // satu DB uji bersama -> berkas tes berurutan
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "file:./test.db",
      JWT_SECRET: "uji-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
      CORS_ORIGINS: "http://localhost:5173",
      GATEWAY_BASE_URL: "http://gateway.uji.local",
      GATEWAY_API_KEY: "uji_gateway_key_0123456789",
      GATEWAY_WEBHOOK_SECRET: "uji_webhook_secret_0123456789",
      BCRYPT_COST: "4",
      LOGIN_MAX: "1000",
      EMAIL_DELAY_MS: "1",
      UPLOAD_DIR: "uploads-uji",
      DOCS_ENABLED: "1",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      reporter: ["text-summary", "html"],
    },
  },
});
