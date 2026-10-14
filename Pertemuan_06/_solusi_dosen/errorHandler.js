// KUNCI JAWABAN DOSEN
import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, req, res, next) {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { kode: "JSON_RUSAK", pesan: "Body bukan JSON yang valid" } });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: { kode: "BODY_TERLALU_BESAR", pesan: "Body melebihi batas ukuran" } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { kode: err.kode, pesan: err.message, ...(err.detail ? { detail: err.detail } : {}) },
    });
  }
  console.error(err);
  res.status(500).json({ error: { kode: "KESALAHAN_SERVER", pesan: "Terjadi kesalahan pada server" } });
}
