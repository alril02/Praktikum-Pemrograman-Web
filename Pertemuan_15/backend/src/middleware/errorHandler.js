import multer from "multer";
import { HttpError } from "../utils/httpError.js";

// Bentuk respons error SELALU: { error: { kode, pesan, detail? } }
export function errorHandler(err, req, res, next) {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { kode: "JSON_RUSAK", pesan: "Body bukan JSON yang valid" } });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: { kode: "BODY_TERLALU_BESAR", pesan: "Body melebihi batas ukuran" } });
  }

  // Galat dari Multer (unggahan)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: { kode: "BERKAS_TERLALU_BESAR", pesan: "Ukuran berkas melebihi batas" } });
    }
    return res.status(422).json({
      error: {
        kode: "VALIDASI",
        pesan: "Data tidak valid",
        detail: [{ field: err.field || "gambar", pesan: "Unggahan tidak sesuai ketentuan (gunakan field \"gambar\", satu berkas)" }],
      },
    });
  }

  if (err instanceof HttpError) {
    if (err.status === 401) res.set("WWW-Authenticate", 'Bearer realm="toko-api"');
    return res.status(err.status).json({
      error: { kode: err.kode, pesan: err.message, ...(err.detail ? { detail: err.detail } : {}) },
    });
  }

  // Galat HTTP 4xx dari middleware pihak ketiga (mis. express.static: 403 traversal, 404 tidak ada)
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500) {
    const peta = { 400: "PERMINTAAN_TIDAK_VALID", 403: "DILARANG", 404: "TIDAK_DITEMUKAN" };
    const pesan = err.status === 404 ? "Berkas tidak ditemukan" : "Permintaan tidak dapat diproses";
    return res.status(err.status).json({ error: { kode: peta[err.status] ?? "PERMINTAAN_DITOLAK", pesan } });
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
