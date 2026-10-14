import { HttpError } from "../utils/httpError.js";

// Wajib 4 parameter agar dikenali Express sebagai error handler.
// Bentuk respons error SELALU: { error: { kode, pesan, detail? } }
export function errorHandler(err, req, res, next) {
  // TODO 3a: JSON rusak dari express.json() (err.type === "entity.parse.failed") -> 400, kode "JSON_RUSAK"

  // TODO 3b: body terlalu besar (err.type === "entity.too.large") -> 413, kode "BODY_TERLALU_BESAR"

  // TODO 3c: HttpError -> status/kode/pesan/detail dari error tersebut

  // 3d: selain itu 500 generik. Detail hanya dicatat di server, JANGAN dikirim ke klien.
  console.error(err);
  res.status(500).json({
    error: { kode: "KESALAHAN_SERVER", pesan: "Terjadi kesalahan pada server" },
  });
}
