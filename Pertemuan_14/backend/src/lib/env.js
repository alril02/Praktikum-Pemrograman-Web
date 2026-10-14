// Validasi konfigurasi lingkungan.  Uji dengan:  npm test   (tests/env.test.mjs)
//
// periksaEnv(env) -> { ok: boolean, masalah: string[], peringatan: string[] }
//   masalah    : kesalahan yang MENGHALANGI start (ok = false bila ada)
//   peringatan : sebaiknya diperbaiki tetapi tidak menghalangi
//
// TODO — aturan UMUM (semua lingkungan):
//   1. JWT_SECRET ada dan >= 32 karakter                               -> masalah
//   2. DATABASE_URL ada                                                -> masalah
//   3. GATEWAY_BASE_URL ada dan berupa URL http(s)                     -> masalah
//   4. GATEWAY_API_KEY >= 16 karakter                                  -> masalah
//   5. GATEWAY_WEBHOOK_SECRET >= 16 karakter                           -> masalah
//   6. CORS_ORIGINS ada                                                -> masalah
//
// TODO — aturan KHUSUS PRODUKSI (NODE_ENV === "production"):
//   7.  JWT_SECRET bukan placeholder umum ("ganti", "changeme", "secret", "password")
//       dan bukan satu karakter diulang                                -> masalah
//   8.  DATABASE_URL tidak diawali "file:" (SQLite tidak untuk produksi) -> masalah
//   9.  GATEWAY_BASE_URL diawali "https://"                            -> masalah
//   10. CORS_ORIGINS tidak mengandung "*" maupun "localhost"/"127.0.0.1" -> masalah
//   11. TRUST_PROXY harus bilangan bulat >= 1 (aplikasi di balik proxy) -> masalah
//   12. BCRYPT_COST (bila ada) >= 10                                   -> masalah
//   13. LOGIN_MAX > 30                                                 -> peringatan
//
//   Pesan masalah/peringatan harus menyebut NAMA variabelnya (mis. "JWT_SECRET ...").
export function periksaEnv(env = process.env) {
  void env;
  return { ok: true, masalah: [], peringatan: [] };
}
