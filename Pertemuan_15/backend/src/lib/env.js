// KUNCI JAWABAN DOSEN - salin ke src/lib/env.js
const PLACEHOLDER = ["ganti", "changeme", "secret", "password", "contoh", "example"];

function bacaTeks(v) {
  return typeof v === "string" ? v : "";
}

export function periksaEnv(env = process.env) {
  const masalah = [];
  const peringatan = [];
  const produksi = env.NODE_ENV === "production";

  // ---- umum ----
  const jwt = bacaTeks(env.JWT_SECRET);
  if (jwt.length < 32) masalah.push("JWT_SECRET wajib diatur dan minimal 32 karakter");

  if (!bacaTeks(env.DATABASE_URL)) masalah.push("DATABASE_URL wajib diatur");

  const gw = bacaTeks(env.GATEWAY_BASE_URL);
  if (!/^https?:\/\/.+/.test(gw)) masalah.push("GATEWAY_BASE_URL wajib berupa URL http(s)");

  if (bacaTeks(env.GATEWAY_API_KEY).length < 16) masalah.push("GATEWAY_API_KEY wajib diatur (minimal 16 karakter)");
  if (bacaTeks(env.GATEWAY_WEBHOOK_SECRET).length < 16) {
    masalah.push("GATEWAY_WEBHOOK_SECRET wajib diatur (minimal 16 karakter)");
  }

  const cors = bacaTeks(env.CORS_ORIGINS);
  if (!cors) masalah.push("CORS_ORIGINS wajib diatur");

  // ---- khusus produksi ----
  if (produksi) {
    const rendah = jwt.toLowerCase();
    if (jwt && (PLACEHOLDER.some((p) => rendah.includes(p)) || new Set(jwt).size === 1)) {
      masalah.push("JWT_SECRET terlihat seperti placeholder/nilai lemah; gunakan rahasia acak");
    }

    if (bacaTeks(env.DATABASE_URL).startsWith("file:")) {
      masalah.push("DATABASE_URL memakai SQLite (file:); produksi wajib database jaringan terkelola");
    }

    if (gw && !gw.startsWith("https://")) masalah.push("GATEWAY_BASE_URL wajib https:// pada produksi");

    if (cors && /(\*|localhost|127\.0\.0\.1)/.test(cors)) {
      masalah.push("CORS_ORIGINS tidak boleh memuat '*', localhost, atau 127.0.0.1 pada produksi");
    }

    const tp = bacaTeks(env.TRUST_PROXY);
    if (!/^\d+$/.test(tp) || Number(tp) < 1) {
      masalah.push("TRUST_PROXY wajib bilangan bulat >= 1 pada produksi (aplikasi berada di balik proxy)");
    }

    if (env.BCRYPT_COST !== undefined && env.BCRYPT_COST !== "") {
      const c = Number(env.BCRYPT_COST);
      if (!Number.isFinite(c) || c < 10) masalah.push("BCRYPT_COST minimal 10 pada produksi");
    }

    if (Number(env.LOGIN_MAX) > 30) {
      peringatan.push("LOGIN_MAX sangat tinggi; pembatas laju login menjadi kurang efektif");
    }
  }

  return { ok: masalah.length === 0, masalah, peringatan };
}
