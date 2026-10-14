import { HttpError } from "../utils/httpError.js";

// Bentuk respons error SELALU: { error: { kode, pesan, detail? } }
export function errorHandler(err, req, res, next) {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { kode: "JSON_RUSAK", pesan: "Body bukan JSON yang valid" } });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: { kode: "BODY_TERLALU_BESAR", pesan: "Body melebihi batas ukuran" } });
  }

  if (err instanceof HttpError) {
    // 401 sebaiknya menyertakan petunjuk skema autentikasi (RFC 9110)
    if (err.status === 401) res.set("WWW-Authenticate", 'Bearer realm="toko-api"');
    return res.status(err.status).json({
      error: { kode: err.kode, pesan: err.message, ...(err.detail ? { detail: err.detail } : {}) },
    });
  }

  switch (err?.code) {
    case "P2002":
      return res.status(409).json({ error: { kode: "DATA_SUDAH_ADA", pesan: "Data dengan nilai unik tersebut sudah ada" } });
    case "P2003":
      return res.status(409).json({ error: { kode: "RELASI_MASIH_DIPAKAI", pesan: "Data masih direferensikan oleh data lain" } });
    case "P2025":
      return res.status(404).json({ error: { kode: "TIDAK_DITEMUKAN", pesan: "Data tidak ditemukan" } });
    default:
      break;
  }

  console.error(err);
  res.status(500).json({ error: { kode: "KESALAHAN_SERVER", pesan: "Terjadi kesalahan pada server" } });
}
